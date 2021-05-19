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
      setImmediate(() => {
        child.emit('exit', 0, null);
        child.stdout.emit('data', 'stdout-data');
        child.stdout.emit('end');
        child.stderr.emit('data', 'stderr-data');
        child.stderr.emit('end');
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
        Assert.deepEqual(writable.buffer.join('').split('\n'), [
          '#0 (out of 1): node main.js ...',
          '#0 stdout >>',
          '  | stdout-data',
          '#0 stderr >>',
          '  | stderr-data',
          '#0 exit with: 0',
          '',
        ]);
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
  // // multiple inline childeren //
  // {
  //   const writable = new Writable();
  //   setSpawnForTesting((...args) => {
  //     Assert.deepEqual(args.slice(0, 2), ['node', ['main1.js']]);
  //     setSpawnForTesting((...args) => {
  //       Assert.deepEqual(args.slice(0, 2), ['node', ['main2.js']]);
  //       throw new Error('BOUM');
  //     });
  //     const child = new Events.EventEmitter();
  //     child.stdout = null;
  //     child.stderr = null;
  //     return child;
  //   });
  //   (
  //     await main(process.cwd(), writable, {
  //       extends: 'tmp/test/appmap.json',
  //       childeren: ['node main1.js', 'node main2.js'],
  //       protocol: 'inline',
  //       _: [],
  //     })
  //   ).either(
  //     (message) => {
  //       Assert.equal(message, 'child errors:\n  - #1 spawning error >> failed to spawn child >> BOUM');
  //       Assert.deepEqual(writable.buffer, [
  //         '#0 (out of 2): node main1.js ...\n',
  //         '#1 (out of 2): node main2.js ...\n',
  //         '#1 failed with: spawning error >> failed to spawn child >> BOUM\n'
  //       ]);
  //     },
  //     (code) => {
  //       Assert.fail();
  //     },
  //   );
  // }
  // child running error
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['node', ['main1.js']]);
      setSpawnForTesting((...args) => {
        Assert.fail();
      });
      const child = new Events.EventEmitter();
      child.stdout = null;
      child.stderr = null;
      setImmediate(() => {
        child.emit('error', new Error('BOUM'));
      });
      return child;
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        childeren: ['node main1.js'],
        protocol: 'inline',
        _: [],
      })
    ).either(
      (message) => {
        Assert.equal(message, 'child errors:\n  - #0 running error >> BOUM');
      },
      (code) => {
        Assert.fail();
      },
    );
  }
  // child spawning error
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['node', ['main.js']]);
      setSpawnForTesting((...args) => {
        Assert.fail();
      });
      throw new Error('BOUM');
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        childeren: 'node main.js',
        protocol: 'inline',
        _: [],
      })
    ).either(
      (message) => {
        Assert.equal(message, 'child errors:\n  - #0 spawning error >> BOUM');
      },
      (code) => {
        Assert.fail();
      },
    );
  }
  // killed child //
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['node', ['main.js']]);
      setSpawnForTesting(() => {
        Assert.fail();
      });
      const child = new Events.EventEmitter();
      child.stdout = null;
      child.stderr = null;
      setImmediate(() => {
        child.emit('exit', null, 'SIGINT');
      });
      return child;
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        childeren: 'node main.js',
        protocol: 'inline',
        _: [],
      })
    ).either(
      (message) => {
        Assert.fail();
      },
      (code) => {
        Assert.equal(code, 1);
        Assert.deepEqual(writable.buffer, [
          '#0 (out of 1): node main.js ...\n',
          '#0 killed with: SIGINT\n',
        ]);
      },
    );
  }
  // 123 exit child //
  {
    const writable = new Writable();
    setSpawnForTesting((...args) => {
      Assert.deepEqual(args.slice(0, 2), ['node', ['main.js']]);
      setSpawnForTesting(() => {
        Assert.fail();
      });
      const child = new Events.EventEmitter();
      child.stdout = null;
      child.stderr = null;
      setImmediate(() => {
        child.emit('exit', 123, null);
      });
      return child;
    });
    (
      await main(process.cwd(), writable, {
        extends: 'tmp/test/appmap.json',
        childeren: 'node main.js',
        protocol: 'inline',
        _: [],
      })
    ).either(
      (message) => {
        Assert.equal(message, 'child errors:\n  - #0 client agent error');
      },
      (code) => {
        Assert.fail();
      },
    );
  }
})();
