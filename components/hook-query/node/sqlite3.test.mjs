import Sqlite3 from "sqlite3";
import {
  assertEqual,
  assertDeepEqual,
  assertFail,
  assertMatch,
  assertThrow,
} from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookSqlite3 from "./sqlite3.mjs";

const { Promise, undefined, Error, setTimeout } = globalThis;

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

const database = new Database(":memory:");

const testCaseAsync = (enabled, runAsync) =>
  testHookAsync(
    HookSqlite3,
    { configuration: { hooks: { sqlite3: enabled }, session: "session" } },
    runAsync,
  );

const createTrace = (sql, parameters, _error) => [
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
      database: "sqlite3",
      version: null,
      sql,
      parameters,
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

// Disable //
assertDeepEqual(await testCaseAsync(false, async () => {}), []);

// TypeError //
assertDeepEqual(
  await testCaseAsync(true, () => {
    assertThrow(() => database.run(), /^TypeError: missing sql query string/u);
    assertThrow(() => database.run(123), /^TypeError:/u);
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
      assertMatch(message, /^SQLITE_ERROR:/u);
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
    [{ type: "string", print: '"foo"' }],
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
