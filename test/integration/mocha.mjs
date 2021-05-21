// import * as Path from 'path';
import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { main } from '../../lib/server/main.mjs';

const getEvent = ({ event }) => event;

FileSystem.writeFileSync(
  'tmp/test/appmap.json',
  JSON.stringify(
    {
      output: {
        directory: '.',
      },
      enabled: true,
      packages: [
        {
          path: '.',
        },
      ],
      children: [
        {
          type: 'spawn',
          recorder: 'mocha',
          exec: ['npx', 'mocha'],
          argv: ['mod.test.js'],
        },
      ],
    },
    null,
    2,
  ),
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/mod.test.js',
  `
    const {strict: Assert} = require('assert');
    const {foo, bar} = require("./mod.js");
    describe("mod", function () {
      describe("foo", function () {
        it("should synchronously return 'foo'", function () {
          Assert.equal(foo(null), "foo");
        });
        it ("should asynchronously return 'foo'", function (done) {
          foo((result) => {
            Assert.equal(result, "foo");
            done();
          });
        });
      });
      describe("bar", function () {
        it("should synchronously return 'bar'", function () {
          Assert.equal(bar(true), "bar");
        });
        it ("should asynchronously return 'bar'", async function () {
          Assert.equal(await bar(false), "bar");
        });
      });
    });
  `,
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/mod.js',
  `
    exports.foo = (callback) => {
      if (callback === null) {
        return 'foo';
      }
      setImmediate(callback, "foo");
    };
    exports.bar = (synchronous) => {
      if (synchronous) {
        return "bar";
      }
      return Promise.resolve("bar");
    };
  `,
  'utf8',
);

const unlink = (path) => {
  try {
    FileSystem.unlinkSync(path);
  } catch (error) {
    Assert.equal(error.code, 'ENOENT');
  }
};

const readEventArray = (path) =>
  JSON.parse(FileSystem.readFileSync(path, 'utf8')).events.map(getEvent);

(async () => {
  // 'http1', 'http2', 'inline'
  for (let protocol of ['messaging']) {
    unlink('tmp/test/mod-foo-0.appmap.json');
    unlink('tmp/test/mod-foo-1.appmap.json');
    unlink('tmp/test/mod-bar-0.appmap.json');
    unlink('tmp/test/mod-bar-1.appmap.json');
    Assert.equal(
      (
        await main(process.cwd(), process.stdout, {
          extends: 'tmp/test/appmap.json',
          protocol,
          _: [],
        })
      ).fromRight(),
      0,
    );
    Assert.deepEqual(readEventArray(`tmp/test/mod-foo-0.appmap.json`, 'utf8'), [
      'call',
      'call',
      'return',
      'return',
    ]);
    Assert.deepEqual(readEventArray(`tmp/test/mod-foo-1.appmap.json`, 'utf8'), [
      'call',
      'call',
      'return',
      'return',
      'call',
      'return',
    ]);
    Assert.deepEqual(readEventArray(`tmp/test/mod-bar-0.appmap.json`, 'utf8'), [
      'call',
      'call',
      'return',
      'return',
    ]);
    Assert.deepEqual(readEventArray(`tmp/test/mod-bar-1.appmap.json`, 'utf8'), [
      'call',
      'call',
      'return',
      'return',
    ]);
  }
})();
