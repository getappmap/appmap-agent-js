import { spawn } from "child_process";
import { tmpdir } from "os";
import Pg from "pg";
import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import HookPg from "./pg.mjs";

const { Client, Query } = Pg;

const {
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  fail: assertFail,
  match: assertMatch,
} = Assert;

const promiseTermination = (child) =>
  new Promise((resolve, reject) => {
    child.on("exit", (status, signal) => resolve({ status, signal }));
    child.on("error", reject);
  });

const port = 5432;
const user = "postgres";
const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;

const proceedAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = await buildOneAsync("hook", "test");

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

  const trace = [
    {
      type: "send",
      data: {
        type: "event",
        data: {
          type: "before",
          index: 1,
          data: {
            type: "query",
            database: "postgres",
            version: null,
            sql: "SELECT $1::integer * $2::integer AS solution;",
            parameters: [
              { type: "number", print: "2" },
              { type: "number", print: "3" },
            ],
          },
          group: 0,
          time: 0,
        },
      },
    },
    {
      type: "send",
      data: {
        type: "event",
        data: {
          type: "after",
          index: 1,
          data: { type: "query", error: null },
          group: 0,
          time: 0,
        },
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
    trace,
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
    trace,
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
    const extract = ([
      {
        data: {
          data: {
            data: { sql },
          },
        },
      },
      {
        data: {
          data: {
            data: {
              error: { constructor: _constructor },
            },
          },
        },
      },
    ]) => ({ sql, constructor: _constructor });
    assertDeepEqual(
      extract(
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
      { sql: "INVALID SQL;", constructor: "DatabaseError" },
    );
    assertDeepEqual(
      extract(
        await testCaseAsync(true, async (client) => {
          try {
            await client.query("INVALID SQL;");
          } catch ({ message }) {
            assertMatch(message, /^syntax error/);
          }
        }),
      ),
      { sql: "INVALID SQL;", constructor: "DatabaseError" },
    );
  }
};

const testAsync = async () => {
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
            path,
            "--username",
            user,
          ],
          { stdio: "inherit" },
        ),
      ),
      { signal: null, status: 0 },
    );
    const child = spawn("postgres", ["-D", path, "-p", String(port)], {
      stdio: "inherit",
    });
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
      await promiseTermination(spawn("/bin/sh", ["-c", `rm -rf ${path}$`]));
    }
  }
};

testAsync();
