import * as Path from 'path';
import * as Net from 'net';
import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import { strict as Assert } from 'assert';
import { fileURLToPath } from 'url';
import { makeRequest } from '../../../../../../../lib/client/node/channel/request/messaging.js';

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

{
  const server = Net.createServer();
  try {
    FileSystem.unlinkSync('tmp/test/unix-domain-socket.sock');
  } catch (error) {
    Assert.equal(error.code, 'ENOENT');
  }
  server.listen('tmp/test/unix-domain-socket.sock');
  server.on('listening', () => {
    server.on('connection', (socket) => {
      socket.destroy();
      socket.on('close', () => {
        server.close();
      });
    });
    makeRequest('foobar', 'tmp/test/unix-domain-socket.sock');
  });
}
