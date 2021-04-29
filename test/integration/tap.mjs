import * as Path from 'path';
import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import main from '../../lib/server/main.mjs';

const iterator = [
  {
    name: 'tape',
    argv: [],
    esm: null,
    cjs: (id) => `
      const test = require('tape');
      const { ${id} } = require('./${id}.js');
      test('${id}', function (t) {
        t.equal(${id}(), '${id}');
        t.end();
      });
    `,
  },
  // {
  //   name: "tap",
  //   argv: ["--no-coverage"],
  //   esm: (id) => `
  //     import tap from 'tap';
  //     import { ${id} } from './${id}.mjs';
  //     tap.equal(${id}(), '${id}');
  //   `,
  //   cjs: (id) => `
  //     const tap = require('tap');
  //     const { ${id} } = require('./${id}.js');
  //     tap.equal(${id}(), '${id}');
  //   `,
  // },
][Symbol.iterator]();

FileSystem.writeFileSync(
  'tmp/test/appmap.json',
  JSON.stringify(
    {
      output: 'alongside',
      enabled: ['*', '../../node_modules/tap/.bin/tape'],
      packages: ['.'],
    },
    null,
    2,
  ),
  'utf8',
);

const ids = ['foo', 'bar'];

ids.forEach((id) => {
  FileSystem.writeFileSync(
    `tmp/test/${id}.js`,
    `exports.${id} = () => '${id}';`,
    'utf8',
  );
  FileSystem.writeFileSync(
    `tmp/test/${id}.mjs`,
    `export const ${id} = () => '${id}';`,
    'utf8',
  );
});

const step = () => {
  const { done, value } = iterator.next();

  if (done) {
    process.stdout.write('DONE\n');
  } else {
    ids.forEach((id) => {
      if (value.esm !== null) {
        FileSystem.writeFileSync(
          `tmp/test/${id}.test.mjs`,
          value.esm(id),
          'utf8',
        );
      }
      if (value.cjs !== null) {
        FileSystem.writeFileSync(
          `tmp/test/${id}.test.js`,
          value.cjs(id),
          'utf8',
        );
      }
    });

    ids.forEach((id) => {
      ['mjs', 'js'].forEach((ext) => {
        try {
          FileSystem.unlinkSync(`tmp/test/${id}.test.${ext}.appmap.json`);
        } catch (error) {
          Assert.equal(error.code, 'ENOENT');
        }
      });
    });

    main(
      'spawn',
      {
        'rc-file': 'tmp/test/appmap.json',
        'hook-esm': value.esm !== null,
        'hook-cjs': value.cjs !== null,
      },
      [
        'npx',
        value.name,
        ...value.argv,
        ...(value.cjs === null
          ? []
          : ids.map((id) => `tmp/test/${id}.test.js`)),
        ...(value.esm === null
          ? []
          : ids.map((id) => `tmp/test/${id}.test.mjs`)),
      ],
      (error, server, client) => {
        Assert.equal(error, null);
        client.on('exit', (code, signal) => {
          Assert.equal(signal, null);
          Assert.equal(code, 0);
        });
        server.on('close', () => {
          ids.forEach((id) => {
            [
              ...(value.esm === null ? [] : ['mjs']),
              ...(value.cjs === null ? [] : ['cjs']),
            ].forEach((ext) => {
              const appmap = JSON.parse(
                FileSystem.readFileSync(
                  `tmp/test/${id}.test.${ext}.appmap.json`,
                  'utf8',
                ),
              );
              appmap.version = null;
              appmap.metadata = null;
              Assert.deepEqual(appmap.classMap.length, 2);
              Assert.deepEqual(appmap.classMap[1].childeren.length, 1);
              appmap.classMap.childeren[0] = null;
              appmap.events = appmap.events.map(({ id, event }) => ({
                id,
                event,
              }));
              Assert.deepEqual(appmap, {
                version: null,
                metadata: null,
                classMap: [
                  {
                    type: 'package',
                    name: Path.resolve(`tmp/test/${id}.test.${ext}`),
                    childeren: [],
                  },
                  {
                    type: 'package',
                    name: Path.resolve(`tmp/test/${id}.${ext}`),
                    childeren: [null],
                  },
                ],
                events: [
                  {
                    id: 1,
                    event: 'call',
                  },
                  {
                    id: 2,
                    event: 'return',
                  },
                ],
              });
            });
          });
          step();
        });
      },
    );
  }
};

step();
