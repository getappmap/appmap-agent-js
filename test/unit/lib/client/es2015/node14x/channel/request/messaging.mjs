import * as Path from 'path';
import * as ChildProcess from 'child_process';
import { strict as Assert } from 'assert';
import { fileURLToPath } from 'url';
import { setExitForTesting } from '../../../../../../../../lib/client/es2015/node14x/check.js';
import { makeRequest } from '../../../../../../../../lib/client/es2015/node14x/channel/request/messaging.js';

setExitForTesting((code) => {
  throw new Error(code);
});

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
  for (let host of ['localhost', '127.0.0.1']) {
    const request = makeRequest(host, port);
    Assert.equal(
      request({
        type: 'right',
        body: 123,
      }),
      123,
    );
  }
  child.kill('SIGINT');
});

// Assert.throws(() => makeRequest('invalid-address', 0), /^Error: 123$/);

Assert.throws(
  () => makeRequest('foobar', './missing/ipc-socket.sock'),
  /^Error: 123$/,
);
