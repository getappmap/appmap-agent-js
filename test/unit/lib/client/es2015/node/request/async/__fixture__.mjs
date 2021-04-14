import { strict as Assert } from 'assert';
import * as ChildProcess from 'child_process';
import * as Path from 'path';
import dirname from '../__fixture_dirname__.js';

export default (protocol, makeRequestAsync) => {
  const child = ChildProcess.fork(
    Path.join(dirname, '__fixture_http_server__.mjs'),
    [protocol, '0'],
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
    }
  };

  child.on('exit', (code, signal) => {
    Assert.equal(code, null);
    Assert.equal(signal, 'SIGINT');
  });

  child.on('message', (port) => {
    let callback = null;
    const requestAsync = makeRequestAsync('localhost', port, (...args) => {
      Assert.equal(args.length, 1);
      callback(args[0]);
    });
    increment();
    requestAsync({ status: 200, body: '' }, null);
    callback = (error1) => {
      Assert.deepEqual(error1, null);
      requestAsync({ status: 200, body: '123' }, null);
      callback = (error2) => {
        Assert.ok(error2 instanceof Error);
        Assert.equal(error2.message, 'Unexpected non-null response');
        requestAsync({ status: 400, body: 'BOUM' }, null);
        callback = (error3) => {
          Assert.ok(error3 instanceof Error);
          Assert.equal(error3.message, 'http 400 >> BOUM');
          decrement();
        };
      };
    };
    increment();
    requestAsync(
      {
        status: 200,
        body: '123',
      },
      {
        reject: () => Assert.fail('Unexpected rejection'),
        resolve: (...args) => {
          Assert.deepEqual(args, [123]);
          decrement();
        },
      },
    );
    increment();
    requestAsync(
      {
        status: 400,
        body: '@BOUM',
      },
      {
        reject: (...args) => {
          Assert.equal(args.length, 1);
          Assert.ok(args[0] instanceof Error);
          Assert.equal(args[0].message, 'http 400 >> @BOUM');
          decrement();
        },
        resolve: () => Assert.fail('Unexpected rejection'),
      },
    );
    increment();
    requestAsync(
      {
        status: 200,
        body: '@invalid-json',
      },
      {
        reject: (...args) => {
          Assert.equal(args.length, 1);
          Assert.ok(args[0] instanceof Error);
          Assert.equal(
            args[0].message,
            'Unexpected token @ in JSON at position 0',
          );
          decrement();
        },
        resolve: () => Assert.fail('Unexpected rejection'),
      },
    );
  });
};
