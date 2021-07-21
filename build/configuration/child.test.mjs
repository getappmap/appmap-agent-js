import * as FileSystem from 'fs';
import * as Path from 'path';
import { strict as Assert } from 'assert';
import { Right, fromRight } from '../../../../../lib/server/either.mjs';
import { home } from '../../../../../lib/home.js';
import {
  setSpawnForTesting,
  normalizeChild,
  spawnNormalizedChild,
} from '../../../../../lib/server/configuration/child.mjs';

const makeMockConfiguration = (options) => {
  const configuration1 = {
    protocol: 'inline',
    port: 0,
    host: 'localhost',
    data: 123,
    getProtocol(...args) {
      Assert.equal(this, configuration1);
      Assert.deepEqual(args, []);
      return this.protocol;
    },
    getHost(...args) {
      Assert.equal(this, configuration1);
      Assert.deepEqual(args, []);
      Assert.notEqual(this.protocol, 'inline');
      return this.host;
    },
    getPort(...args) {
      Assert.equal(this, configuration1);
      Assert.deepEqual(args, []);
      Assert.notEqual(this.protocol, 'inline');
      return this.port;
    },
    extendWithData(...args) {
      Assert.equal(this, configuration1);
      Assert.deepEqual(args, [{ cwd: process.cwd() }]);
      Assert.equal(this.protocol, 'inline');
      const configuration2 = {
        serialize(...args) {
          Assert.equal(this, configuration2);
          Assert.deepEqual(args, []);
          return configuration1.data;
        },
      };
      return new Right(configuration2);
    },
    ...options,
  };
  return configuration1;
};

const spawnAsync = (child, options) =>
  new Promise((resolve) => {
    child = spawnNormalizedChild(
      child,
      makeMockConfiguration(options),
    ).fromRight();
    let stdout = '';
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      console.log(data.toString('utf8'));
      Assert.fail();
    });
    child.on('exit', (status, signal) => {
      Assert.equal(signal, null);
      Assert.equal(status, 0);
    });
    child.stdout.on('end', () => {
      resolve(stdout);
    });
  });

(async () => {
  // normal recorder //
  {
    FileSystem.writeFileSync('tmp/test/foo.txt', 'bar', 'utf8');
    const children = normalizeChild('cat tmp/test/foo.txt');
    Assert.ok(Array.isArray(children));
    Assert.equal(children.length, 1);
    Assert.equal(await spawnAsync(children[0], {}), 'bar');
    Assert.ok(
      spawnNormalizedChild(
        {
          ...children[0],
          exec: null,
        },
        makeMockConfiguration(),
      ).isLeft(),
    );
  }

  // normal recorder //
  {
    FileSystem.writeFileSync('tmp/test/foo.txt', 'bar', 'utf8');
    const children = normalizeChild(['cat', 'tmp/test/foo.txt']);
    Assert.ok(Array.isArray(children));
    Assert.equal(children.length, 1);
    Assert.deepEqual(children, children.flatMap(normalizeChild));
    Assert.deepEqual(
      children,
      normalizeChild({
        type: 'spawn',
        exec: 'cat',
        argv: ['tmp/test/foo.txt'],
      }),
    );
    Assert.deepEqual(
      children,
      normalizeChild({
        type: 'spawn',
        exec: ['cat'],
        argv: ['tmp/test/foo.txt'],
      }),
    );
    Assert.equal(await spawnAsync(children[0], {}), 'bar');
  }

  // mocha recorder (inline) //
  {
    FileSystem.writeFileSync(
      'tmp/test/main.js',
      `console.log(JSON.stringify({
      argv: process.argv.slice(2),
      configuration: JSON.parse(process.env.APPMAP_CONFIGURATION),
      protocol: process.env.APPMAP_PROTOCOL,
    }));`,
      'utf8',
    );
    const children = normalizeChild({
      type: 'spawn',
      recorder: 'mocha',
      exec: ['node', 'tmp/test/main.js'],
      argv: ['foo', 'bar'],
    });
    Assert.ok(Array.isArray(children));
    Assert.equal(children.length, 1);
    Assert.deepEqual(
      JSON.parse(
        await spawnAsync(children[0], {
          protocol: 'inline',
          data: 123,
        }),
        'bar',
      ),
      {
        argv: [
          '--require',
          Path.join(home, 'lib', 'client', 'node', 'recorder', 'mocha-bin.js'),
          'foo',
          'bar',
        ],
        configuration: 123,
        protocol: 'inline',
      },
    );
  }

  // mocha recorder (not-inline) //
  for (let port of [0, 'unix-domain-socket']) {
    FileSystem.writeFileSync(
      'tmp/test/main.js',
      `console.log(JSON.stringify({
      argv: process.argv.slice(2),
      configuration: JSON.parse(process.env.APPMAP_CONFIGURATION),
      protocol: process.env.APPMAP_PROTOCOL,
      host: process.env.APPMAP_HOST,
      port: process.env.APPMAP_PORT,
    }));`,
      'utf8',
    );
    const children = normalizeChild({
      type: 'spawn',
      recorder: 'mocha',
      exec: ['node', 'tmp/test/main.js'],
      argv: ['foo', 'bar'],
    });
    Assert.ok(Array.isArray(children));
    Assert.equal(children.length, 1);
    Assert.deepEqual(
      JSON.parse(
        await spawnAsync(children[0], {
          port,
          host: 'localhost',
          protocol: 'messaging',
        }),
        'bar',
      ),
      {
        argv: [
          '--require',
          Path.join(home, 'lib', 'client', 'node', 'recorder', 'mocha-bin.js'),
          'foo',
          'bar',
        ],
        configuration: {
          cwd: process.cwd(),
        },
        protocol: 'messaging',
        host: 'localhost',
        port: String(port),
      },
    );
  }

  // fork //
  FileSystem.writeFileSync('tmp/test/foo.txt', '123', 'utf8');
  FileSystem.writeFileSync('tmp/test/goo.txt', '123', 'utf8');
  Assert.deepEqual(
    normalizeChild({
      type: 'fork',
      globbing: true,
      main: Path.resolve('tmp/test/[fg]oo.txt'),
    }),
    [
      ...normalizeChild({
        type: 'fork',
        globbing: false,
        main: 'tmp/test/foo.txt',
      }),
      ...normalizeChild({
        type: 'fork',
        globbing: false,
        main: 'tmp/test/goo.txt',
      }),
    ],
  );

  setSpawnForTesting(() => {
    return {
      foo: 'bar',
      stdout: null,
      stderr: null,
    };
  });
  Assert.deepEqual(
    normalizeChild('foo bar')
      .map((child) => spawnNormalizedChild(child, makeMockConfiguration()))
      .map(fromRight),
    [
      {
        foo: 'bar',
        stdout: null,
        stderr: null,
      },
    ],
  );
})();
