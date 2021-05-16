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
  // single child with pipe std //
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['node', ['main.js']]);
      setSpawnForTesting(() => {
        Assert.fail();
      });
      const child = new Events.EventEmitter();
      child.stdout = new Events.EventEmitter();
      child.stderr = new Events.EventEmitter();
      child.spawnargs = ['foo', 'bar'];
      child.kill = () => {
        Assert.fail();
      };
      setImmediate(() => {
        child.stdout.emit('data', 'stdout-data');
        setImmediate(() => {
          child.stderr.emit('data', 'stderr-data');
          setImmediate(() => {
            child.emit('exit', 0, null);
          });
        });
      });
      return child;
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        _: ['node', 'main.js'],
      })
    ).either(
      (message) => {
        Assert.fail();
      },
      (code) => {
        Assert.equal(code, 0);
        Assert.equal(
          writable.buffer.join(''),
          [
            'foo bar exit with 0',
            'stdout:',
            'stdout-data',
            'stderr:',
            'stderr-data',
            '',
          ].join('\n'),
        );
      },
    );
  }
  // no childeren //
  {
    const writable = new Writable();
    setSpawnForTesting(() => {
      Assert.fail();
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        _: [],
      })
    ).either(
      (message) => {
        Assert.fail();
      },
      (code) => {
        Assert.equal(code, 0);
        Assert.deepEqual(writable.buffer, []);
      },
    );
  }
  // invalid port //
  {
    const writable = new Writable();
    setSpawnForTesting(() => {
      Assert.fail();
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        port: 'missing/socket.sock',
        _: ['node', 'main.js'],
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
  // multiple inline childeren //
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['node', ['main1.js']]);
      setSpawnForTesting((...args) => {
        Assert.deepEqual(args.slice(0, 2), ['node', ['main2.js']]);
        throw new Error('BOUM');
      });
      const child = new Events.EventEmitter();
      child.kill = (...args) => {
        Assert.deepEqual(args, ['SIGKILL']);
        setImmediate(() => {
          child.emit('exit', null, 'SIGKILL');
        });
      };
      child.stdout = null;
      child.stderr = null;
      child.spawnargs = ['foo', 'bar'];
      return child;
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        childeren: ['node main1.js', 'node main2.js'],
        protocol: 'inline',
        _: [],
      })
    ).either(
      (message) => {
        Assert.equal(message, 'failed to spawn child >> BOUM');
        Assert.deepEqual(writable.buffer, []);
      },
      (code) => {
        Assert.fail();
      },
    );
  }
  // signal child //
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['node', ['main.js']]);
      setSpawnForTesting(() => {
        Assert.fail();
      });
      const child = new Events.EventEmitter();
      child.kill = () => {
        Assert.fail();
      };
      child.stdout = null;
      child.stderr = null;
      child.spawnargs = ['foo', 'bar'];
      setImmediate(() => {
        child.emit('exit', null, 'SIGINT');
      });
      return child;
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        childeren: 'node main.js',
        _: [],
      })
    ).either(
      (message) => {
        Assert.fail();
      },
      (code) => {
        Assert.equal(code, 1);
        Assert.equal(writable.buffer.join(''), 'foo bar killed with SIGINT\n');
      },
    );
  }
  // non-zero exit child //
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['node', ['main.js']]);
      setSpawnForTesting(() => {
        Assert.fail();
      });
      const child = new Events.EventEmitter();
      child.kill = () => {
        Assert.fail();
      };
      child.stdout = null;
      child.stderr = null;
      child.spawnargs = ['foo', 'bar'];
      setImmediate(() => {
        child.emit('exit', 1, null);
      });
      return child;
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        childeren: 'node main.js',
        _: [],
      })
    ).either(
      (message) => {
        Assert.fail();
      },
      (code) => {
        Assert.equal(code, 1);
        Assert.equal(writable.buffer.join(''), 'foo bar exit with 1\n');
      },
    );
  }
})();
