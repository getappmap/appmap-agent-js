import { env, exit, platform } from "node:process";
import Pg from "pg";
import {
  assertEqual,
  assertDeepEqual,
  assertFail,
  assertMatch,
} from "../../__fixture__.mjs";
import { hasOwnProperty } from "../../util/index.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookPg from "./pg.mjs";

const { Promise } = globalThis;

const { Client, Query } = Pg;

if (
  hasOwnProperty(env, "SKIP_TEST") &&
  env.SKIP_TEST.toLowerCase().includes("pg")
) {
  exit(0);
}

const auth = {
  host: "/var/run/postgresql",
};

const proceedAsync = async () => {
  const testCaseAsync = (enabled, runAsync) =>
    testHookAsync(
      HookPg,
      { configuration: { hooks: { pg: enabled }, session: "session" } },
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
      session: "session",
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
      session: "session",
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
      session: "session",
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
      session: "session",
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
      session: "session",
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
      session: "session",
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

if (platform !== "win32") {
  proceedAsync();
}
