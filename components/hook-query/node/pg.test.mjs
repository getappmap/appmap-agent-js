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

// TODO investigate why this fails on travis.
if (Reflect.getOwnPropertyDescriptor(process.env, "TRAVIS") !== undefined) {
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
  const { testHookAsync, makeEvent } = await buildTestComponentAsync("hook");

  const { hookPg, unhookPg } = HookPg(dependencies);

  const testCaseAsync = (enabled, runAsync) =>
    testHookAsync(hookPg, unhookPg, { hooks: { pg: enabled } }, async () => {
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
    });

  const events = [
    makeEvent("begin", 1, 0, "bundle", null),
    makeEvent("before", 2, 0, "query", {
      database: "postgres",
      version: null,
      sql: "SELECT $1::integer * $2::integer AS solution;",
      parameters: [
        { type: "number", print: "2" },
        { type: "number", print: "3" },
      ],
    }),
    makeEvent("after", 2, 0, "query", { error: null }),
    makeEvent("end", 1, 0, "bundle", null),
  ];

  // disabled //
  assertDeepEqual(await testCaseAsync(false, async () => {}), {
    sources: [],
    events: [],
  });

  // promise //
  assertDeepEqual(
    await testCaseAsync(true, async (client) => {
      const { rows } = await client.query(
        "SELECT $1::integer * $2::integer AS solution;",
        [2, 3],
      );
      assertDeepEqual(rows, [{ solution: 6 }]);
    }),
    { sources: [], events },
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
    { sources: [], events },
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
    { sources: [], events: [] },
  );

  // invalid sql //
  {
    const cleanup = ({ sources, events }) => ({
      sources,
      events: events.slice(0, 2),
    });
    assertDeepEqual(
      cleanup(
        await testCaseAsync(true, async (client) => {
          const query = new Query("INVALID SQL;");
          const promise = new Promise((resolve) => {
            query.on("error", resolve);
          });
          client.query(query);
          const { message } = await promise;
          assertMatch(message, /^syntax error/);
        }),
      ),
      {
        sources: [],
        events: [
          makeEvent("begin", 1, 0, "bundle", null),
          makeEvent("before", 2, 0, "query", {
            database: "postgres",
            parameters: {},
            sql: "INVALID SQL;",
            version: null,
          }),
        ],
      },
    );
    assertDeepEqual(
      cleanup(
        await testCaseAsync(true, async (client) => {
          try {
            await client.query("INVALID SQL;");
          } catch ({ message }) {
            assertMatch(message, /^syntax error/);
          }
        }),
      ),
      {
        sources: [],
        events: [
          makeEvent("begin", 1, 0, "bundle", null),
          makeEvent("before", 2, 0, "query", {
            database: "postgres",
            parameters: {},
            sql: "INVALID SQL;",
            version: null,
          }),
        ],
      },
    );
  }
};

if (Reflect.getOwnPropertyDescriptor(process.env, "TRAVIS")) {
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
