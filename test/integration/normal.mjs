// import * as Path from 'path';
import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { main } from '../../lib/server/main.mjs';

FileSystem.writeFileSync(
  'tmp/test/appmap.json',
  JSON.stringify(
    {
      output: {
        directory: '.',
        'file-name': 'foo',
      },
      enabled: true,
      packages: [
        {
          path: 'main.mjs',
        },
        {
          path: 'module1.js',
        },
      ],
      children: [
        {
          type: 'fork',
          recorder: 'normal',
          main: 'main.mjs',
        },
      ],
    },
    null,
    2,
  ),
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/main.mjs',
  `
    import * as module1 from "./module1.js";
    (function main () {
      module1.foo();
    } ());
  `,
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/module1.js',
  `
    const module2 = require("./module2.js");
    exports.foo = function module1 () { module2.bar(); };
  `,
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/module2.js',
  `
    exports.bar = function module2 () {};
  `,
  'utf8',
);

(async () => {
  for (let protocol of ['messaging', 'http1', 'http2', 'inline']) {
    try {
      FileSystem.unlinkSync('tmp/test/foo.appmap.json');
    } catch (error) {
      Assert.equal(error.code, 'ENOENT');
    }
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
    Assert.deepEqual(
      JSON.parse(
        FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
      ).events.map(({ event }) => event),
      ['call', 'call', 'return', 'return'],
    );
  }
})();
