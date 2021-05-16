import * as Path from 'path';
import * as ChildProcess from 'child_process';
import { strict as Assert } from 'assert';
import { fileURLToPath } from 'url';
import { makeRequest } from '../../../../../../../../lib/client/es2015/node14x/channel/request/messaging.js';

const child = ChildProcess.fork(
  Path.join(
    Path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '__fixture_net_server__.mjs',
  ),
  ['0'],
  {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  },
);
child.on('exit', (code, signal) => {
  Assert.equal(code, null);
  Assert.equal(signal, 'SIGINT');
});

child.on('message', (port) => {
  const request = makeRequest('localhost', port);
  Assert.equal(
    request({
      type: 'right',
      body: 123,
    }),
    123,
  );
  Assert.throws(
    () =>
      request({
        type: 'left',
        body: 'BOUM',
      }),
    /^Error: BOUM/,
  );
  Assert.throws(
    () =>
      request({
        type: 'invalid',
        body: null,
      }),
    /^Error: invalid response type/,
  );
  child.kill('SIGINT');
});

Assert.throws(() => makeRequest('invalid-address', 0));

Assert.throws(() => makeRequest('foobar', '/missing-ipc-socket.sock'));
