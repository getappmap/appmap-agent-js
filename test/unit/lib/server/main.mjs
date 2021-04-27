import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import main from '../../../../lib/server/main.mjs';

FileSystem.writeFileSync(
  'tmp/test/rc.json',
  JSON.stringify({
    'output-dir': '.',
    'map-name': 'foo',
    enabled: true,
    packages: ['.'],
  }),
  'utf8',
);

FileSystem.writeFileSync('tmp/test/main.js', '(function f () {} ());', 'utf8');

const test = (method, options, command, callback) => {
  try {
    FileSystem.unlinkSync('tmp/test/foo.appmap.json');
  } catch (error) {
    Assert.equal(error.code, 'ENOENT');
  }
  main(
    method,
    {
      'rc-file': 'tmp/test/rc.json',
      ...options,
    },
    command,
    (error, server, client) => {
      if (error !== null) {
        callback(error);
      } else {
        client.on('exit', (code, signal) => {
          Assert.equal(signal, null);
          Assert.equal(code, 0);
          const appmap = JSON.parse(
            FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
          );
          Assert.ok(Array.isArray(appmap.events));
          Assert.ok(appmap.events.length > 0);
          callback(null);
        });
      }
    },
  );
};

test('foobar', {}, ['node', 'tmp/test/main.js'], (error) => {
  Assert.notEqual(error, null);
  Assert.ok(error.message.startsWith('Invalid method'));
  test('spawn', { port: -1 }, ['node', 'tmp/test/main.js'], (error) => {
    Assert.notEqual(error, null);
    Assert.ok(error.message.startsWith('invalid options'));
    test('spawn', {}, [], (error) => {
      Assert.notEqual(error, null);
      Assert.ok(error.message.startsWith('Empty command'));
      test(
        'spawn',
        { protocol: 'inline', port: 1234 },
        ['node', 'tmp/test/main.js'],
        (error) => {
          Assert.equal(error, null);
          test(
            'spawn',
            { protocol: 'messaging' },
            ['node', 'tmp/test/main.js'],
            (error) => {
              Assert.equal(error, null);
            },
          );
        },
      );
    });
  });
});
