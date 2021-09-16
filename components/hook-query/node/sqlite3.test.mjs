import { strict as Assert } from "assert";
import Sqlite3 from "sqlite3";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookSqlite3 from "./sqlite3.mjs";

const { Database, Statement } = Sqlite3;

const promisify = (o, m, ...xs) =>
  new Promise((resolve, reject) => {
    const sync = o[m](...xs, function CALLBACK(error, result) {
      if (error) {
        reject(
          this !== undefined
            ? new Error("expected this to be undefined")
            : error,
        );
      } else if (this instanceof Statement) {
        resolve({ sync, async: result });
      } else {
        reject(new Error("expected this to be a Statement instance"));
      }
    });
  });

const {
  // ok: assert,
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  fail: assertFail,
  match: assertMatch,
  throws: assertThrows,
} = Assert;

const testAsync = async () => {
  const database = new Database(":memory:");

  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync } = await buildTestComponentAsync("hook");
  const { hookSqlite3, unhookSqlite3 } = HookSqlite3(dependencies);

  const testCaseAsync = (enabled, runAsync) =>
    testHookAsync(
      hookSqlite3,
      unhookSqlite3,
      { hooks: { sqlite3: enabled } },
      runAsync,
    );

  const createTrace = (sql, parameters, error) => [
    {
      type: "trace",
      data: {
        type: "event",
        data: {
          type: "begin",
          index: 1,
          data: {
            type: "bundle",
          },
          time: 0,
        },
      },
    },
    {
      type: "trace",
      data: {
        type: "event",
        data: {
          type: "before",
          index: 2,
          data: {
            type: "query",
            database: "sqlite3",
            version: null,
            sql,
            parameters,
          },
          time: 0,
        },
      },
    },
    {
      type: "trace",
      data: {
        type: "event",
        data: {
          type: "after",
          index: 2,
          data: { type: "query", error },
          time: 0,
        },
      },
    },
    {
      type: "trace",
      data: {
        type: "event",
        data: {
          type: "end",
          index: 1,
          data: {
            type: "bundle",
          },
          time: 0,
        },
      },
    },
  ];

  // Disable //
  assertDeepEqual(await testCaseAsync(false, async () => {}), []);

  // TypeError //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      assertThrows(
        () => database.run(),
        /^TypeError: missing sql query string/u,
      );
      assertThrows(
        () => database.run(123),
        /^TypeError: first argument is expected to be a sql query string/u,
      );
    }),
    [],
  );

  //////////////
  // Database //
  //////////////

  // invalid //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      try {
        await promisify(database, "run", "INVALID SQL;");
        assertFail();
      } catch ({ message }) {
        assertMatch(message, /^SQLITE_ERROR:/);
      }
    }),
    createTrace("INVALID SQL;", [], {
      type: "object",
      constructor: "Error",
      index: 1,
      print: 'Error: SQLITE_ERROR: near "INVALID": syntax error',
      specific: {
        type: "error",
        message: 'SQLITE_ERROR: near "INVALID": syntax error',
        stack: 'Error: SQLITE_ERROR: near "INVALID": syntax error',
      },
    }),
  );
  // run //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      assertDeepEqual(
        await promisify(database, "run", "SELECT ? AS solution;", ["foo"]),
        { sync: database, async: undefined },
      );
    }),
    createTrace(
      "SELECT ? AS solution;",
      [{ type: "string", print: "foo" }],
      null,
    ),
  );

  // get //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      assertDeepEqual(
        await promisify(database, "get", "SELECT ? AS solution;", [123]),
        { sync: database, async: { solution: 123 } },
      );
    }),
    createTrace(
      "SELECT ? AS solution;",
      [{ type: "number", print: "123" }],
      null,
    ),
  );

  // all //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      assertDeepEqual(
        await promisify(database, "all", "SELECT $param AS solution;", {
          $param: 123,
        }),
        { sync: database, async: [{ solution: 123 }] },
      );
    }),
    createTrace(
      "SELECT $param AS solution;",
      { $param: { type: "number", print: "123" } },
      null,
    ),
  );

  // each //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      let resolve;
      let reject;
      const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      assertDeepEqual(
        await promisify(
          database,
          "each",
          "SELECT ? AS solution;",
          [123],
          function each(...args) {
            try {
              assertDeepEqual(args, [null, { solution: 123 }]);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
        ),
        { sync: database, async: 1 },
      );
      await promise;
    }),
    createTrace(
      "SELECT ? AS solution;",
      [{ type: "number", print: "123" }],
      null,
    ),
  );

  ///////////////
  // Statement //
  ///////////////

  // run //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      const { sync: statement, async: _async } = await promisify(
        database,
        "prepare",
        "SELECT 123 AS solution;",
      );
      assertEqual(_async, undefined);
      setTimeout(() => {
        statement.finalize();
      });
      assertDeepEqual(await promisify(statement, "run"), {
        sync: statement,
        async: undefined,
      });
    }),
    createTrace("SELECT 123 AS solution;", [], null),
  );

  // run //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      const { sync: statement, async: _async } = await promisify(
        database,
        "prepare",
        "SELECT ? * ? AS solution;",
        2,
        3,
      );
      assertEqual(_async, undefined);
      setTimeout(() => {
        statement.finalize();
      });
      assertDeepEqual(await promisify(statement, "get"), {
        sync: statement,
        async: { solution: 6 },
      });
    }),
    createTrace(
      "SELECT ? * ? AS solution;",
      [
        { type: "number", print: "2" },
        { type: "number", print: "3" },
      ],
      null,
    ),
  );

  // all //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      const { sync: statement, async: _async } = await promisify(
        database,
        "prepare",
        "SELECT $param1 * $param2 AS solution;",
        { $param1: 2 },
      );
      assertEqual(_async, undefined);
      setTimeout(() => {
        statement.finalize();
      });
      assertDeepEqual(await promisify(statement, "all", { $param2: 3 }), {
        sync: statement,
        async: [{ solution: 6 }],
      });
    }),
    createTrace(
      "SELECT $param1 * $param2 AS solution;",
      {
        $param1: { type: "number", print: "2" },
        $param2: { type: "number", print: "3" },
      },
      null,
    ),
  );

  // each (no final callback) //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      const { sync: statement, async: _async } = await promisify(
        database,
        "prepare",
        "SELECT ? * ? AS solution;",
        2,
        3,
      );
      assertEqual(_async, undefined);
      setTimeout(() => {
        statement.finalize();
      });
      assertDeepEqual(await promisify(statement, "each"), {
        sync: statement,
        async: { solution: 6 },
      });
      // NB: Leave time for recordAfterQuery to be called.
      await new Promise((resolve) => {
        setTimeout(resolve);
      });
    }),
    createTrace(
      "SELECT ? * ? AS solution;",
      [
        { type: "number", print: "2" },
        { type: "number", print: "3" },
      ],
      null,
    ),
  );
  // bind //
  assertDeepEqual(
    await testCaseAsync(true, async () => {
      const { sync: statement, async: _async } = await promisify(
        database,
        "prepare",
        "SELECT ? * ? AS solution;",
        2,
      );
      assertEqual(_async, undefined);
      assertEqual(statement.reset(), statement);
      assertEqual(statement.bind(2), statement);
      setTimeout(() => {
        statement.finalize();
      });
      assertDeepEqual(await promisify(statement, "get", 3), {
        sync: statement,
        async: { solution: 6 },
      });
    }),
    createTrace(
      "SELECT ? * ? AS solution;",
      [
        { type: "number", print: "2" },
        { type: "number", print: "3" },
      ],
      null,
    ),
  );
};

testAsync();
