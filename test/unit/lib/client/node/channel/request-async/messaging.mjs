import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import * as Path from 'path';
import { fileURLToPath } from 'url';
import { strict as Assert } from 'assert';
import * as Net from 'net';
import { makeRequestAsync } from '../../../../../../../lib/client/node/channel/request-async/messaging.js';

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

// let counter = 0;
// const increment = () => {
//   counter += 1;
// };
// const decrement = () => {
//   counter -= 1;
//   if (counter === 0) {
//     child.kill('SIGINT');
//     const path = 'tmp/ipc.sock';
//     FileSystem.unlink(path, (error) => {
//       if (error !== null) {
//         Assert.equal(error.code, 'ENOENT');
//       }
//       const server = Net.createServer();
//       server.on('connection', (socket) => {
//         socket.end();
//         server.close();
//       });
//       server.listen(path, () => {
//         makeRequestAsync('localhost', path, () => {
//           Assert.fail();
//         });
//       });
//     });
//   }
// };

child.on('exit', (code, signal) => {
  Assert.equal(code, null);
  Assert.equal(signal, 'SIGINT');
});

child.on('message', async (port) => {
  let callback = null;
  const requestAsync = makeRequestAsync('localhost', port, (...args) => {
    Assert.deepEqual(args, []);
    callback();
  });
  // discarded //
  Assert.equal(
    requestAsync(
      {
        type: 'right',
        body: null,
      },
      true,
    ),
    undefined,
  );
  // await new Promise((resolve, reject) => {
  //   callback = resolve;
  //   Assert.equal(
  //     requestAsync(
  //       {
  //         type: 'right',
  //         body: null,
  //       },
  //       true,
  //     ),
  //     undefined,
  //   );
  // });
  // await new Promise((resolve, reject) => {
  //   callback = (error) => {
  //     Assert.match(error.message, /foo$/);
  //     resolve();
  //   };
  //   Assert.equal(
  //     requestAsync(
  //       {
  //         type: 'left',
  //         body: 'foo',
  //       },
  //       true,
  //     ),
  //     undefined,
  //   );
  // });
  // await new Promise((resolve, reject) => {
  //   callback = (error) => {
  //     Assert.equal(error.message, 'expected null response body');
  //     resolve();
  //   };
  //   Assert.equal(
  //     requestAsync(
  //       {
  //         type: 'right',
  //         body: 123,
  //       },
  //       true,
  //     ),
  //     undefined,
  //   );
  // });
  // await new Promise((resolve, reject) => {
  //   callback = (error) => {
  //     Assert.equal(error.message, 'invalid response type');
  //     resolve();
  //   };
  //   Assert.equal(
  //     requestAsync(
  //       {
  //         type: 'invalid',
  //         body: 123,
  //       },
  //       true,
  //     ),
  //     undefined,
  //   );
  // });
  // not-discarded //
  Assert.equal(await requestAsync({ type: 'right', body: 123 }), 123);
  // try {
  //   await requestAsync({ type: 'left', body: 'foo' });
  //   Assert.fail();
  // } catch (error) {
  //   Assert.equal(error.message, 'foo');
  // }
  // try {
  //   await requestAsync({ type: 'invalid', body: 'foo' });
  //   Assert.fail();
  // } catch (error) {
  //   Assert.equal(error.message, 'invalid response type');
  // }
  const p1 = requestAsync({ type: 'right', body: 123 });
  const p2 = requestAsync({ type: 'right', body: 456 });
  Assert.equal(await p1, 123);
  Assert.equal(await p2, 456);
  // done //
  child.kill('SIGINT');
  // unix domain socket //
  const path = 'tmp/ipc.sock';
  try {
    FileSystem.unlinkSync(path);
  } catch (error) {
    Assert.equal(error.code, 'ENOENT');
  }
  const server = Net.createServer();
  server.on('connection', (socket) => {
    socket.end();
    server.close();
  });
  server.listen(path, () => {
    makeRequestAsync('localhost', path, () => {
      Assert.fail();
    });
  });
});
