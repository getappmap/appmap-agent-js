
import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import * as Path from 'path';
import { strict as Assert } from 'assert';
import makeRequestSync from '../../../../../../../../lib/client/es2015/node/request/sync/curl.js';
import dirname from '../__fixture_dirname__.js';

const requestSync = makeRequestSync(1, 'localhost', '/missing/unix-socket.sock');

const child = ChildProcess.fork(
  Path.join(dirname, '__fixture_http_server__.mjs'),
  ['http1', '0'],
  {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  },
);
child.on('exit', (code, signal) => {
  Assert.equal(code, null);
  Assert.equal(signal, 'SIGINT');
});

child.on('message', (port) => {
  const requestSync = makeRequestSync(1, 'localhost', port);
  Assert.equal(
    requestSync({
      status: 200,
      body: "123",
    }),
    123,
  );
  Assert.throws(
    () =>
      requestSync({
        status: 400,
        body: 'BOUM',
      }),
    /^Error: http status 400 >> BOUM/,
  );
  child.kill('SIGINT');
});
