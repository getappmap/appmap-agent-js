import * as ChildProcess from 'child_process';
import * as MySQL from 'mysql';
import { strict as Assert } from 'assert';
import { hookMySQL } from '../../../../../../lib/client/node/hook/mysql.js';

const PORT = 3307;
const PATH = './tmp/test/data';

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
      port: PORT,
      user: "root",
    });
    connection.connect();
    connection.query(
      'SELECT ? * ? AS solution;',
      [2, 3],
      function (error1, results) {
        Assert.equal(results[0].solution, 6);
        connection.query(
          'INVALID SQL;',
          (error) => {}
        );
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
              ['sql_result', {error:null}],
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
    const { signal, status } = ChildProcess.spawnSync(
      'rm',
      ['-rf',  PATH],
      { stdio: 'inherit' },
    );
    Assert.equal(signal, null);
    Assert.equal(status, 0);
  }
  {
    const { signal, status } = ChildProcess.spawnSync(
      '/usr/local/mysql/bin/mysqld',
      [
        '--initialize-insecure',
        '--default-authentication-plugin=mysql_native_password',
        '--datadir',
        PATH
      ],
      { stdio: 'inherit' },
    );
    Assert.equal(signal, null);
    Assert.equal(status, 0);
  }
  const child = ChildProcess.spawn(
    '/usr/local/mysql/bin/mysqld',
    ['--port', String(PORT), '--datadir', PATH],
    { stdio: 'inherit' },
  );
  process.on('exit', () => {
    child.kill('SIGINT');
  });
  const probe = () => {
    const { status, signal } = ChildProcess.spawnSync(
      '/usr/local/mysql/bin/mysqladmin',
      ['--host', 'localhost', '--port', String(PORT), '--user', 'root', 'ping'],
      { stdio: 'inherit' },
    );
    Assert.equal(signal, null);
    if (status === 0) {
      proceed().then(() => {
        process.exit(0);
      });
    } else {
      setTimeout(probe, 1000);
    }
  };
  setTimeout(probe, 1000);
}
