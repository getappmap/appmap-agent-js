import * as Events from 'events';
import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { setSpawnForTesting } from '../../../../lib/server/configuration/child.mjs';
import { main } from '../../../../lib/server/main.mjs';

FileSystem.writeFileSync(
  'tmp/test/appmap.json',
  JSON.stringify({
    enabled: true,
  }),
  'utf8',
);

class Writable {
  constructor() {
    this.buffer = [];
  }
  write(...args) {
    Assert.ok(this instanceof Writable);
    Assert.equal(args.length, 1);
    Assert.equal(typeof args[0], 'string');
    this.buffer.push(args[0]);
  }
}

(async () => {
  // inline with multiple childeren
  {
    const iterator = [
      // success with pipe
      (...args) => {
        Assert.deepEqual(args.slice(0, 2), ['node', ['success-pipe.js']]);
        const child = new Events.EventEmitter();
        child.stdout = new Events.EventEmitter();
        child.stdout.readableEncoding = 'utf8';
        child.stderr = new Events.EventEmitter();
        child.stderr.readableEncoding = 'buffer';
        setImmediate(() => {
          child.emit('exit', 0, null);
          child.stdout.emit('data', 'stdout');
          child.stdout.emit('end');
          child.stderr.emit('data', Buffer.from([1, 2, 3]));
          child.stderr.emit('end');
        });
        return child;
      },
      // base failure
      (...args) => {
        Assert.deepEqual(args.slice(0, 2), ['node', ['base-exit.js']]);
        const child = new Events.EventEmitter();
        child.stdout = null;
        child.stderr = null;
        setImmediate(() => {
          child.emit('exit', 1, null);
        });
        return child;
      },
      // meta failure
      (...args) => {
        Assert.deepEqual(args.slice(0, 2), ['node', ['meta-exit.js']]);
        const child = new Events.EventEmitter();
        child.stdout = null;
        child.stderr = null;
        setImmediate(() => {
          child.emit('exit', 123, null);
        });
        return child;
      },
      // running error
      (...args) => {
        Assert.deepEqual(args.slice(0, 2), ['node', ['running-error.js']]);
        const child = new Events.EventEmitter();
        child.stdout = null;
        child.stderr = null;
        setImmediate(() => {
          child.emit('error', new Error('BOUM'));
        });
        return child;
      },
      // spawning error
      (...args) => {
        Assert.deepEqual(args.slice(0, 2), ['node', ['spawning-error.js']]);
        throw new Error('BOUM');
      },
      // killed
      (...args) => {
        Assert.deepEqual(args.slice(0, 2), ['node', ['kill.js']]);
        const child = new Events.EventEmitter();
        child.stdout = null;
        child.stderr = null;
        setImmediate(() => {
          child.emit('exit', 0, 'SIGINT');
        });
        return child;
      },
    ][Symbol.iterator]();
    const next = () => {
      const { done, value } = iterator.next();
      if (done) {
        setSpawnForTesting(() => {
          Assert.fail();
        });
      } else {
        setSpawnForTesting((...args) => {
          next();
          return value(...args);
        });
      }
    };
    next();
    const writable = new Writable();
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        protocol: 'inline',
        childeren: [
          ['node', 'success-pipe.js'],
          ['node', 'base-exit.js'],
          ['node', 'meta-exit.js'],
          ['node', 'running-error.js'],
          ['node', 'spawning-error.js'],
        ],
        _: ['node', 'kill.js'],
      })
    ).either(
      (message) => {
        Assert.equal(
          message,
          'there was some appmap-related errors on spawned childeren',
        );
        Assert.deepEqual(
          writable.buffer.join(''),
          [
            'Spawing 6 childeren (max 1 concurrent childeren) ...',
            '#0: spawn node success-pipe.js ...',
            '#0 stdout >>',
            '  | stdout',
            '#0 stderr >> 010203',
            '#0 exit with: 0',
            '#1: spawn node base-exit.js ...',
            '#1 exit with: 1',
            '#2: spawn node meta-exit.js ...',
            '#2 failed with: client agent error',
            '#3: spawn node running-error.js ...',
            '#3 failed with: running error >> BOUM',
            '#4: spawn node spawning-error.js ...',
            '#4 failed with: spawning error >> BOUM',
            '#5: spawn node kill.js ...',
            '#5 killed with: SIGINT',
            'Summary:',
            '  - #0: spawn node success-pipe.js >> 0',
            '  - #1: spawn node base-exit.js >> 1',
            '  - #2: spawn node meta-exit.js >> client agent error',
            '  - #3: spawn node running-error.js >> running error >> BOUM',
            '  - #4: spawn node spawning-error.js >> spawning error >> BOUM',
            '  - #5: spawn node kill.js >> SIGINT',
            '',
          ].join('\n'),
        );
      },
      (code) => {
        Assert.fail();
      },
    );
  }

  // messaging with a single success childeren //
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['/bin/sh', ['-c', 'node main.js']]);
      const child = new Events.EventEmitter();
      child.stdout = null;
      child.stderr = null;
      setImmediate(() => {
        child.emit('exit', 0, null);
      });
      return child;
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        port: 0,
        childeren: 'node main.js',
        _: [],
      })
    ).either(
      (message) => {
        Assert.fail();
      },
      (code) => {
        Assert.deepEqual(writable.buffer, [
          'Spawing 1 childeren (max 1 concurrent childeren) ...\n',
          "#0: spawn /bin/sh -c 'node main.js' ...\n",
          '#0 exit with: 0\n',
        ]);
        Assert.equal(code, 0);
      },
    );
  }

  // messaging invalid port //
  {
    const writable = new Writable();
    setSpawnForTesting(() => {
      Assert.fail();
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        port: 'missing/socket.sock',
        childeren: ['node main.js'],
        _: [],
      })
    ).either(
      (message) => {
        Assert.match(message, /^failed to listening to port/);
        Assert.deepEqual(writable.buffer, []);
      },
      (code) => {
        Assert.fail();
      },
    );
  }
})();
