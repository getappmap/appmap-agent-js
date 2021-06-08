import * as ChildProcess from 'child_process';
import PostgreSQL from 'pg';
import { strict as Assert } from 'assert';
import { hookPG } from '../../../../../../lib/client/node/hook/pg.js';

const PORT = 5432;
const USER = 'postgres';
const PATH = './tmp/test/postgres';

const proceed = async () => {
  // setup //
  const trace = [];
  const record = (...args) => {
    Assert.equal(args.length, 1);
    trace.push(args[0]);
  };
  const unhook = hookPG({}, () => ({
    recordCall: record,
    recordReturn: record,
  }));
  const client = new PostgreSQL.Client({
    host: 'localhost',
    port: PORT,
    user: USER,
    database: 'postgres',
  });
  client.connect();
  // promise //
  Assert.deepEqual(
    (
      await client.query(
        'SELECT $1::integer * $2::integer AS solution;',
        [2, 3],
      )
    ).rows,
    [{ solution: 6 }],
  );
  try {
    await client.query('INVALID SQL1;');
    Assert.fail();
  } catch (error) {
    Assert.equal(error.message, 'syntax error at or near "INVALID"');
  }
  // no-callback //
  Assert.equal(
    (
      await new Promise((resolve, reject) => {
        const query = new PostgreSQL.Query('INVALID SQL2;');
        query.on('error', resolve);
        client.query(query);
      })
    ).message,
    'syntax error at or near "INVALID"',
  );
  // callback //
  Assert.deepEqual(
    (
      await new Promise((resolve, reject) => {
        const query = new PostgreSQL.Query('SELECT 123::integer AS solution;');
        client.query(query, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      })
    ).rows,
    [{ solution: 123 }],
  );
  // teardown //
  Assert.deepEqual(trace, [
    {
      sql_query: {
        database_type: 'postgres',
        sql: 'SELECT $1::integer * $2::integer AS solution;',
        parameters: [2, 3],
        explain_sql: null,
        server_version: null,
      },
    },
    { sql_result: { error: null } },
    {
      sql_query: {
        database_type: 'postgres',
        sql: 'INVALID SQL1;',
        parameters: null,
        explain_sql: null,
        server_version: null,
      },
    },
    { sql_result: { error: 'syntax error at or near "INVALID"' } },
    {
      sql_query: {
        database_type: 'postgres',
        sql: 'INVALID SQL2;',
        parameters: null,
        explain_sql: null,
        server_version: null,
      },
    },
    { sql_result: { error: 'syntax error at or near "INVALID"' } },
    {
      sql_query: {
        database_type: 'postgres',
        sql: 'SELECT 123::integer AS solution;',
        parameters: null,
        explain_sql: null,
        server_version: null,
      },
    },
    { sql_result: { error: null } },
  ]);
  client.end();
  unhook();
};

if (Reflect.getOwnPropertyDescriptor(process.env, 'TRAVIS')) {
  proceed();
} else {
  {
    const { signal, status } = ChildProcess.spawnSync('rm', ['-rf', PATH], {
      stdio: 'inherit',
    });
    Assert.equal(signal, null);
    Assert.equal(status, 0);
  }
  {
    const { signal, status } = ChildProcess.spawnSync(
      'initdb',
      [
        '--no-locale',
        '--encoding',
        'UTF-8',
        '--pgdata',
        PATH,
        '--username',
        USER,
      ],
      { stdio: 'inherit' },
    );
    Assert.equal(signal, null);
    Assert.equal(status, 0);
  }
  const child = ChildProcess.spawn(
    'postgres',
    ['-D', PATH, '-p', String(PORT)],
    { stdio: 'inherit' },
  );
  process.on('exit', () => {
    child.kill('SIGINT');
  });
  const probe = () => {
    const { signal, status } = ChildProcess.spawnSync(
      'pg_isready',
      ['-U', USER, '-p', String(PORT), '-d', 'postgres', '-t', '0'],
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
