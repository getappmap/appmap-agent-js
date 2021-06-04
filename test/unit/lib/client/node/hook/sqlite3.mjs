import { strict as Assert } from 'assert';
import { hookSQLite3 } from '../../../../../../lib/client/node/hook/sqlite3.js';
import SQLite3 from 'sqlite3';

const trace = [];

const record = (...args) => {
  trace.push(args);
  return record;
};

const unhook = hookSQLite3(record);

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
  database.close();
  unhook();
})();

// db.serialize(function() {
//   db.run("CREATE TABLE lorem (info TEXT)");
//
//   var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
//   for (var i = 0; i < 10; i++) {
//       stmt.run("Ipsum " + i);
//   }
//   stmt.finalize();
//
//   db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
//     console.log(row);
//     console.log(row.id + ": " + row.info);
//   });
// });
