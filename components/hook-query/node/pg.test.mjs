import { spawn } from "child_process";
import { platform as getPlatform } from "node:os";
import { rm as rmAsync } from "fs/promises";
import Pg from "pg";
import {
  assertEqual,
  assertDeepEqual,
  assertFail,
  assertMatch,
} from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { getTmpUrl, convertFileUrlToPath } from "../../path/index.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookPg from "./pg.mjs";

const { Promise, String, setTimeout, URL } = globalThis;

const { Client, Query } = Pg;

const promiseTermination = (child) =>
  new Promise((resolve, reject) => {
    child.on("exit", (status, signal) => resolve({ status, signal }));
    child.on("error", reject);
  });

const auth = {
  host: "localhost",
  password: "",
  port: 5432,
  user: "postgres",
  database: "postgres",
};

const proceedAsync = async () => {
  const testCaseAsync = (enabled, runAsync) =>
    testHookAsync(
      HookPg,
      { configuration: { hooks: { pg: enabled } } },
      async () => {
        const client = new Client(auth);
        try {
          client.connect();
          await runAsync(client);
        } finally {
          client.end();
        }
      },
    );

  const events = [
    {
      type: "event",
      site: "begin",
      tab: 1,
      group: 0,
      time: 0,
      payload: {
        type: "bundle",
      },
    },
    {
      type: "event",
      site: "before",
      tab: 2,
      group: 0,
      time: 0,
      payload: {
        type: "query",
        database: "postgres",
        version: null,
        sql: "SELECT $1::integer * $2::integer AS solution;",
        parameters: [
          { type: "number", print: "2" },
          { type: "number", print: "3" },
        ],
      },
    },
    {
      type: "event",
      site: "after",
      tab: 2,
      group: 0,
      time: 0,
      payload: {
        type: "answer",
      },
    },
    {
      type: "event",
      site: "end",
      tab: 1,
      group: 0,
      time: 0,
      payload: {
        type: "bundle",
      },
    },
  ];

  // disabled //
  assertDeepEqual(await testCaseAsync(false, async () => {}), []);

  // promise //
  assertDeepEqual(
    await testCaseAsync(true, async (client) => {
      const { rows } = await client.query(
        "SELECT $1::integer * $2::integer AS solution;",
        [2, 3],
      );
      assertDeepEqual(rows, [{ solution: 6 }]);
    }),
    events,
  );

  // callback //
  assertDeepEqual(
    await testCaseAsync(true, async (client) => {
      const { rows } = await new Promise((resolve, reject) => {
        const query = new Query(
          "SELECT $1::integer * $2::integer AS solution;",
          [2, 3],
        );
        client.query(query, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
      assertDeepEqual(rows, [{ solution: 6 }]);
    }),
    events,
  );

  // type error //
  assertDeepEqual(
    await testCaseAsync(true, async (client) => {
      try {
        await client.query(null);
        assertFail();
      } catch ({ message }) {
        assertEqual(message, "Client was passed a null or undefined query");
      }
    }),
    [],
  );

  // invalid sql //
  assertDeepEqual(
    (
      await testCaseAsync(true, async (client) => {
        const query = new Query("INVALID SQL;");
        const promise = new Promise((resolve) => {
          query.on("error", resolve);
        });
        client.query(query);
        const { message } = await promise;
        assertMatch(message, /^syntax error/u);
      })
    )[1],
    {
      type: "event",
      site: "before",
      tab: 2,
      group: 0,
      time: 0,
      payload: {
        type: "query",
        database: "postgres",
        version: null,
        sql: "INVALID SQL;",
        parameters: {},
      },
    },
  );

  assertDeepEqual(
    (
      await testCaseAsync(true, async (client) => {
        try {
          await client.query("INVALID SQL;");
        } catch ({ message }) {
          assertMatch(message, /^syntax error/u);
        }
      })
    )[1],
    {
      type: "event",
      site: "before",
      tab: 2,
      group: 0,
      time: 0,
      payload: {
        type: "query",
        database: "postgres",
        version: null,
        sql: "INVALID SQL;",
        parameters: {},
      },
    },
  );
};

// It would be nicer to use travis service:
//
// os: linux
// dist: focal
// service:
//   - postgresql
//
// Unfortunatelly (wtf travis), it doesn't work:
//
// $ travis_setup_postgresql
// Starting PostgreSQL v12
// Assertion failed on job for postgresql@12-main.service.
// sudo systemctl start postgresql@12-main
//
// Downgrading dist to bionic or xenial makes it work.
// But then node 18 cannot be installed (wtf travis 2x).
// The solution seems to restart the service with other conf.
// At this point, it is not any better than to launch the service here.
if (getPlatform() !== "win32") {
  const { initdb, pg_isready, postgres } =
    getPlatform() === "darwin"
      ? { initdb: "initdb", pg_isready: "pg_isready", postgres: "postgres" }
      : {
          initdb: "/usr/lib/postgresql/13/bin/initdb",
          pg_isready: "/usr/lib/postgresql/13/bin/pg_isready",
          postgres: "/usr/lib/postgresql/13/bin/postgres",
        };
  const url = toAbsoluteUrl(getUuid(), getTmpUrl());
  assertDeepEqual(
    await promiseTermination(
      spawn(
        initdb,
        [
          "--pgdata",
          convertFileUrlToPath(url),
          "--no-locale",
          "--encoding",
          "UTF-8",
          "--username",
          auth.user,
        ],
        { stdio: "inherit" },
      ),
    ),
    { status: 0, signal: null },
  );
  if (getPlatform() !== "darwin") {
    assertDeepEqual(
      await promiseTermination(
        spawn("sudo", ["chmod", "777", "/var/run/postgresql/"], {
          stdio: "inherit",
        }),
      ),
      { status: 0, signal: null },
    );
  }
  const child = spawn(
    postgres,
    ["-D", convertFileUrlToPath(url), "-p", String(auth.port)],
    {
      stdio: "inherit",
    },
  );
  const termination = promiseTermination(child);
  let ready = false;
  while (!ready) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    const { status, signal } = await promiseTermination(
      spawn(
        pg_isready,
        ["-U", auth.user, "-p", String(auth.port), "-d", "postgres", "-t", "0"],
        { stdio: "inherit" },
      ),
    );
    assertEqual(signal, null);
    ready = status === 0;
  }
  try {
    await proceedAsync();
  } finally {
    child.kill("SIGTERM");
    assertDeepEqual(await termination, { status: 0, signal: null });
    await rmAsync(new URL(url), { recursive: true });
  }
}
