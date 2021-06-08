import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import { getInitialConfiguration } from '../../../../../lib/server/configuration/index.mjs';
import { Appmap } from '../../../../../lib/server/appmap/index.mjs';

const identity = (any) => any;

const unlink = (path) => {
  try {
    FileSystem.unlinkSync(path);
  } catch (error) {
    Assert.equal(error.code, 'ENOENT');
  }
};

(async () => {
  const appmap = new Appmap(
    getInitialConfiguration()
      .extendWithData({
        cwd: '/base',
        enabled: true,
        packages: [{ path: 'qux' }],
      })
      .fromRight(),
    (path) => {
      Assert.equal(path, `${process.cwd()}/tmp/test/foo`);
      return `${process.cwd()}/tmp/test/bar`;
    },
  );

  Assert.deepEqual((await appmap.initializeAsync('$')).fromRight(), {
    session: '$',
    hooks: {
      cjs: {},
      esm: {},
      http: null,
      mysql: null,
      pg: null,
      sqlite3: null,
    },
  });

  const key = (
    await appmap.startAsync({
      cwd: process.cwd(),
      base: '/base',
      output: {
        directory: 'tmp/test',
        'file-name': 'foo',
      },
    })
  ).fromRight();

  Assert.ok(
    (
      await appmap.instrumentAsync({
        source: 'script',
        path: '/base/qux/invalid-main.js',
        content: '@invalid',
      })
    ).isLeft(),
  );

  Assert.ok(
    (
      await appmap.instrumentAsync({
        source: 'script',
        path: 'base/qux/relative-main.js',
        content: '123;',
      })
    ).isLeft(),
  );

  Assert.equal(
    typeof (
      await appmap.instrumentAsync({
        source: 'script',
        path: '/base/qux/main.js',
        content: '123;',
      })
    ).fromRight(),
    'string',
  );
  const origin = appmap.origins.keys().next().value;

  Assert.equal(
    (await appmap.recordAsync({ origin, event: 'event1' })).fromRight(),
    null,
  );
  Assert.equal((await appmap.pauseAsync(key)).fromRight(), null);
  Assert.equal(
    (await appmap.recordAsync({ origin, event: 'event2' })).fromRight(),
    null,
  );
  Assert.equal((await appmap.playAsync(key)).fromRight(), null);
  Assert.equal(
    (await appmap.recordAsync({ origin, event: 'event3' })).fromRight(),
    null,
  );
  Assert.equal(
    (await appmap.recordAsync({ origin: null, event: 'event4' })).fromRight(),
    null,
  );

  unlink('tmp/test/bar.appmap.json');

  Assert.equal((await appmap.terminateAsync('reason')).fromRight(), null);

  const json = JSON.parse(
    FileSystem.readFileSync('tmp/test/bar.appmap.json', 'utf8'),
  );
  Assert.equal(json.classMap.length, 1);
  Assert.equal(json.classMap[0].type, 'package');
  Assert.equal(json.classMap[0].name, 'qux');
  Assert.deepEqual(json.events, ['event1', 'event3', 'event4']);
})();

{
  const appmap = new Appmap(getInitialConfiguration(), identity);
  appmap.initialize('$');
  Assert.equal(
    appmap
      .instrument({
        source: 'script',
        path: '/main.js',
        content: 'function f () {}',
      })
      .fromRight(),
    'function f () {}',
  );
  const key1 = appmap.start({ cwd: process.cwd() }).fromRight();
  Assert.equal(appmap.stop(key1).fromRight(), null);
  const key2 = appmap.start({ cwd: process.cwd() }).fromRight();
  appmap
    .stopAsync(key2)
    .then((either) => Assert.equal(either.fromRight(), null));
  // key3
  appmap
    .start({
      cwd: process.cwd(),
      output: {
        directory: 'missing',
      },
    })
    .fromRight();
  Assert.ok(appmap.terminate().isLeft());
}
