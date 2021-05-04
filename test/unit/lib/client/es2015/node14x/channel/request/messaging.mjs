import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import * as Path from 'path';
import { fileURLToPath } from 'url';
import { strict as Assert } from 'assert';
import { createServer } from 'net';
import makeRequestAsync from '../../../../../../../../lib/client/es2015/node14x/channel/request/messaging.js';

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

let counter = 0;
const increment = () => {
  counter += 1;
};
const decrement = () => {
  counter -= 1;
  if (counter === 0) {
    child.kill('SIGINT');
    const path = 'tmp/ipc.sock';
    FileSystem.unlink(path, (error) => {
      if (error !== null) {
        Assert.equal(error.code, 'ENOENT');
      }
      const server = createServer();
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
  }
};

child.on('exit', (code, signal) => {
  Assert.equal(code, null);
  Assert.equal(signal, 'SIGINT');
});

child.on('message', (port) => {
  let callback = null;
  const requestAsync = makeRequestAsync('localhost', port, (...args) => {
    Assert.deepEqual(args.length, 1);
    callback(args[0]);
  });
  increment();
  requestAsync(
    {
      success: null,
      failure: null,
    },
    null,
  );
  callback = (error1) => {
    Assert.equal(error1, null);
    requestAsync(
      {
        success: 123,
        failure: null,
      },
      null,
    );
    callback = (error2) => {
      Assert.ok(error2 instanceof Error);
      Assert.equal(error2.message, 'Unexpected non-null response');
      requestAsync(
        {
          success: null,
          failure: 'BOUM',
        },
        null,
      );
      callback = (error3) => {
        Assert.ok(error3 instanceof Error);
        Assert.equal(error3.message, 'BOUM');
        decrement();
      };
    };
  };
  increment();
  requestAsync(
    {
      success: 123,
      failure: null,
    },
    {
      resolve: (...args1) => {
        Assert.deepEqual(args1, [123]);
        requestAsync(
          {
            success: null,
            failure: '@BOUM',
          },
          {
            resolve: () => {
              Assert.fail('Unexpected resolve');
            },
            reject: (...args2) => {
              Assert.equal(args2.length, 1);
              Assert.ok(args2[0] instanceof Error);
              Assert.equal(args2[0].message, '@BOUM');
              decrement();
            },
          },
        );
      },
      reject: () => {
        Assert.fail('Unexpected reject');
      },
    },
  );
});
