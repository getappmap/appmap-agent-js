import * as ChildProcess from 'child_process';
import * as MySQL from 'mysql';
import { strict as Assert } from 'assert';
import { hookMySQL } from '../../../../../../lib/client/node/hook/mysql.js';

const proceed = () =>
  new Promise((resolve, reject) => {
    const trace = [];
    const record = (...args) => {
      trace.push(args);
      return record;
    };
    const unhook = hookMySQL(record);
    var connection = MySQL.createConnection({
      host: 'localhost',
      user: 'root',
    });
    connection.connect();
    connection.query(
      'SELECT ? * ? AS solution;',
      [2, 3],
      function (error1, results, fields) {
        unhook();
        connection.end((error2) => {
          try {
            if (error1) {
              throw error1;
            }
            if (error2) {
              throw error2;
            }
            Assert.equal(results[0].solution, 6);
            Assert.deepEqual(trace, [
              [
                'sql_query',
                {
                  database_type: 'mysql',
                  sql: 'SELECT ? * ? AS solution;',
                  parameters: [2, 3],
                  explain_sql: null,
                  server_version: null,
                },
              ],
              ['sql_result', null],
            ]);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      },
    );
  });

if (Reflect.getOwnPropertyDescriptor(process.env, 'TRAVIS')) {
  proceed();
} else {
  {
    const cmd1 = 'rm -rf ./tmp/test/data';
    const cmd2 =
      '/usr/local/mysql/bin/mysqld --initialize-insecure --default-authentication-plugin=mysql_native_password --datadir ./tmp/test/data';
    const { signal, status } = ChildProcess.spawnSync(
      '/bin/sh',
      ['-c', `${cmd1} && ${cmd2}`],
      { stdio: 'inherit' },
    );
    Assert.equal(signal, null);
    Assert.equal(status, 0);
  }
  const child = ChildProcess.spawn(
    '/bin/sh',
    ['-c', '/usr/local/mysql/bin/mysqld --datadir ./tmp/test/data'],
    { stdio: 'inherit' },
  );
  child.on('exit', (status, signal) => {
    Assert.fail();
  });
  const probe = () => {
    const { status } = ChildProcess.spawnSync(
      '/bin/sh',
      ['-c', '/usr/local/mysql/bin/mysqladmin --user root ping'],
      { stdio: 'inherit' },
    );
    if (status === 0) {
      const cleanup = (error) => {
        child.removeAllListeners('exit');
        child.on('exit', (status, signal) => {
          Assert.equal(signal, 'SIGINT');
          if (error !== null) {
            throw error;
          }
        });
        child.kill('SIGINT');
      };
      proceed()
        .then(() => {
          cleanup(null);
        })
        .catch(cleanup);
    } else {
      setTimeout(probe, 1000);
    }
  };
  probe();
}
