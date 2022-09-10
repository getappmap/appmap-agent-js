import { spawn } from "child_process";
import { rm as rmAsync } from "fs/promises";
import Pg from "pg";
import { fileURLToPath } from "url";
import {
  getFreshTemporaryURL,
  assertEqual,
  assertDeepEqual,
  assertFail,
  assertMatch,
} from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";

const {
  Reflect: { getOwnPropertyDescriptor },
  process,
  Promise,
  undefined,
  String,
  setTimeout,
  URL,
} = globalThis;

// TODO investigate why this fails on travis.

if (getOwnPropertyDescriptor(process.env, "TRAVIS") !== undefined) {
  process.exit(0);
}

const { default: HookPg } = await import("./pg.mjs");

const { Client, Query } = Pg;

const promiseTermination = (child) =>
  new Promise((resolve, reject) => {
    child.on("exit", (status, signal) => resolve({ status, signal }));
    child.on("error", reject);
  });

const port = 5432;
const user = "postgres";
const url = getFreshTemporaryURL();

const proceedAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync } = await buildTestComponentAsync("hook-fixture");

  const component = HookPg(dependencies);

  const testCaseAsync = (enabled, runAsync) =>
    testHookAsync(
      component,
      { configuration: { hooks: { pg: enabled } } },
      async () => {
        const client = new Client({
          host: "localhost",
          port: port,
          user: user,
          database: "postgres",
        });
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
  {
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
  }
};

if (getOwnPropertyDescriptor(process.env, "TRAVIS")) {
  proceedAsync();
} else {
  assertDeepEqual(
    await promiseTermination(
      spawn(
        "initdb",
        [
          "--no-locale",
          "--encoding",
          "UTF-8",
          "--pgdata",
          fileURLToPath(url),
          "--username",
          user,
        ],
        { stdio: "inherit" },
      ),
    ),
    { signal: null, status: 0 },
  );
  const child = spawn(
    "postgres",
    ["-D", fileURLToPath(url), "-p", String(port)],
    {
      stdio: "inherit",
    },
  );
  const termination = promiseTermination(child);
  while (
    /* eslint-disable no-constant-condition */ true /* eslint-enable no-constant-condition */
  ) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    const { status, signal } = await promiseTermination(
      spawn(
        "pg_isready",
        ["-U", user, "-p", String(port), "-d", "postgres", "-t", "0"],
        { stdio: "inherit" },
      ),
    );
    assertEqual(signal, null);
    if (status === 0) {
      break;
    }
  }
  try {
    await proceedAsync();
  } finally {
    child.kill("SIGTERM");
    await termination;
    await rmAsync(new URL(url), { recursive: true });
  }
}
