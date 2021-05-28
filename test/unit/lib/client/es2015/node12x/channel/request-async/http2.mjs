import FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { createServer } from 'http2';
import { makeRequestAsync } from '../../../../../../../../lib/client/es2015/node12x/channel/request-async/http2.js';
import { test } from './__fixture__.mjs';

test('http2', makeRequestAsync);

const path = 'tmp/ipc.sock';
try {
  FileSystem.unlinkSync(path);
} catch (error) {
  Assert.equal(error.code, 'ENOENT');
}
const server = createServer();
server.listen(path, () => {
  makeRequestAsync('localhost', 'tmp/ipc.sock');
  server.on('connection', (socket) => {
    socket.end();
    server.close();
  });
});
