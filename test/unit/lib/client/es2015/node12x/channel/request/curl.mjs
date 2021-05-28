import * as ChildProcess from 'child_process';
import * as Path from 'path';
import { strict as Assert } from 'assert';
import { fileURLToPath } from 'url';
import { makeRequest } from '../../../../../../../../lib/client/es2015/node12x/channel/request/curl.js';

makeRequest(1, 'localhost', '/missing/unix-socket.sock');

const child = ChildProcess.fork(
  Path.join(
    Path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '__fixture_http_server__.mjs',
  ),
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
  const request = makeRequest(1, 'localhost', port);
  Assert.equal(
    request({
      status: 200,
      body: '123',
    }),
    123,
  );
  child.kill('SIGINT');
});
