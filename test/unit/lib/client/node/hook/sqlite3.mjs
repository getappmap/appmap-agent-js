import { strict as Assert } from 'assert';
import { hookSQLite3 } from '../../../../../../lib/client/node/hook/sqlite3.js';
import SQLite3 from 'sqlite3';

const trace = [];

const record = (...args) => {
  Assert.equal(args.length, 1);
  trace.push(args[0]);
};

const unhook = hookSQLite3({}, () => ({
  recordCall: record,
  recordReturn: record,
}));

const database = new SQLite3.Database(':memory:');

(async () => {
  //////////////
  // Database //
  //////////////
  // invalid //
  await new Promise((resolve) => {
    database.run('syntax error;', (...args) => {
      Assert.equal(args.length, 2);
      Assert.ok(args[0] instanceof Error);
      Assert.equal(args[1], undefined);
      resolve();
    });
  });
  // run //
  await new Promise((resolve) => {
    database.run('SELECT ? AS solution;', ['foo'], (...args) => {
      Assert.deepEqual(args, [null, undefined]);
      resolve();
    });
  });

  // get //
  await new Promise((resolve) => {
    database.get('SELECT ? AS solution;', 123, (...args) => {
      Assert.deepEqual(args, [null, { solution: 123 }]);
      resolve();
    });
  });
  // all //
  await new Promise((resolve) => {
    database.all('SELECT $param AS solution;', { $param: 123 }, (...args) => {
      Assert.deepEqual(args, [null, [{ solution: 123 }]]);
      resolve();
    });
  });
  // each //
  await new Promise((resolve) => {
    database.each(
      'SELECT ? AS solution;',
      [123],
      (...args) => {
        Assert.deepEqual(args, [null, { solution: 123 }]);
      },
      (...args) => {
        Assert.deepEqual(args, [null, 1]);
        resolve();
      },
    );
  });
  // exec //
  // await new Promise((resolve) => {
  //   debugger;
  //   database.exec('SELECT 123 AS solution;', (...args) => {
  //     Assert.deepEqual(args, [null, undefined]);
  //     resolve();
  //   });
  // });
  // Statement //
  // run //
  await new Promise((resolve) => {
    database
      .prepare('SELECT 123 AS solution;', (...args) => {
        Assert.deepEqual(args, [null]);
      })
      .run((...args) => {
        Assert.deepEqual(args, [null, undefined]);
        resolve();
      })
      .finalize();
  });
  // get //
  await new Promise((resolve) => {
    database
      .prepare('SELECT ? * ? AS solution;', 2, 3, (...args) => {
        Assert.deepEqual(args, [null]);
      })
      .get((...args) => {
        Assert.deepEqual(args, [null, { solution: 6 }]);
        resolve();
      })
      .finalize();
  });
  // all //
  await new Promise((resolve) => {
    database
      .prepare(
        'SELECT $param1 * $param2 AS solution;',
        { $param1: 2 },
        (...args) => {
          Assert.deepEqual(args, [null]);
        },
      )
      .all({ $param2: 3 }, (...args) => {
        Assert.deepEqual(args, [null, [{ solution: 6 }]]);
        resolve();
      })
      .finalize();
  });
  // each //
  await new Promise((resolve) => {
    database
      .prepare('SELECT ? * ? AS solution;', 2, 3, (...args) => {
        Assert.deepEqual(args, [null]);
      })
      .each((...args) => {
        Assert.deepEqual(args, [null, { solution: 6 }]);
        resolve();
      })
      .finalize();
  });
  // bind //
  await new Promise((resolve) => {
    database
      .prepare('SELECT ? * ? AS solution;', 2)
      .reset()
      .bind(3)
      .get(4, (...args) => {
        Assert.deepEqual(args, [null, { solution: 12 }]);
        resolve();
      })
      .finalize();
  });
  Assert.deepEqual(trace, [
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'syntax error;',
        parameters: [],
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: 'SQLITE_ERROR: near "syntax": syntax error',
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT ? AS solution;',
        parameters: ['foo'],
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT ? AS solution;',
        parameters: [123],
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT $param AS solution;',
        parameters: {
          $param: 123,
        },
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT ? AS solution;',
        parameters: [123],
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT 123 AS solution;',
        parameters: [],
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT ? * ? AS solution;',
        parameters: [2, 3],
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT $param1 * $param2 AS solution;',
        parameters: {
          $param1: 2,
          $param2: 3,
        },
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT ? * ? AS solution;',
        parameters: [2, 3],
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_query: {
        database_type: 'sqlite3',
        sql: 'SELECT ? * ? AS solution;',
        parameters: [3, 4],
        explain_sql: null,
        server_version: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
    {
      sql_result: {
        error: null,
      },
    },
  ]);
  database.close();
  unhook();
})();
