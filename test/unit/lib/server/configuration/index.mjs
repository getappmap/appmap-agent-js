import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { setSpawnForTesting } from '../../../../../lib/server/configuration/child.mjs';
import { getInitialConfiguration } from '../../../../../lib/server/configuration/index.mjs';

////////////////////
// extendWithFile //
////////////////////

Assert.match(
  getInitialConfiguration()
    .extendWithFile('tmp/test/foo.bar', process.cwd())
    .fromLeft(),
  /^invalid extension/,
);

try {
  FileSystem.unlinkSync('tmp/test/foo.json');
} catch (error) {
  Assert.equal(error.code, 'ENOENT');
}

Assert.match(
  getInitialConfiguration()
    .extendWithFile('tmp/test/foo.json', process.cwd())
    .fromLeft(),
  /^failed to read/,
);

FileSystem.writeFileSync('tmp/test/foo.json', 'bar', 'utf8');
Assert.match(
  getInitialConfiguration().extendWithFile('tmp/test/foo.json').fromLeft(),
  /^failed to parse/,
);

Assert.equal(
  getInitialConfiguration()
    .extendWithData({
      cwd: '/',
      extends: {
        cwd: '/',
        port: 1234,
      },
    })
    .fromRight()
    .getPort(),
  1234,
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ extends: 'foo.json' }),
  'utf8',
);
Assert.match(
  getInitialConfiguration().extendWithFile('tmp/test/foo.json').fromLeft(),
  /^detected loop/,
);

////////////////////
// extendWithData //
////////////////////

Assert.equal(
  getInitialConfiguration()
    .extendWithData({ 'app-name': 'foo', cwd: '/base' })
    .fromRight().data['app-name'],
  'foo',
);

///////////////
// isEnabled //
///////////////

Assert.match(
  getInitialConfiguration().isEnabled().fromLeft(),
  /^missing main path/,
);

Assert.equal(
  getInitialConfiguration()
    .extendWithData({ main: 'main.js', cwd: '/base' })
    .fromRight()
    .isEnabled()
    .fromRight(),
  false,
);

Assert.equal(
  getInitialConfiguration()
    .extendWithData({
      enabled: true,
      main: 'main.js',
      cwd: '/base',
    })
    .fromRight()
    .isEnabled()
    .fromRight(),
  true,
);
////////////////////////
// getInstrumentation //
////////////////////////

Assert.deepEqual(
  getInitialConfiguration()
    .extendWithData({
      exclude: ['foo'],
      packages: [
        {
          exclude: ['bar'],
          path: 'qux.js',
          shallow: true,
          enabled: true,
        },
      ],
      cwd: '/base',
    })
    .fromRight()
    .getInstrumentation('/base/qux.js'),
  {
    enabled: true,
    shallow: true,
    exclude: ['bar', 'foo'],
  },
);

///////////////////
// getOutputPath //
///////////////////

Assert.equal(
  getInitialConfiguration()
    .extendWithData({
      output: { directory: 'foo', 'file-name': 'bar' },
      cwd: '/base',
    })
    .fromRight()
    .getOutputPath(),
  '/base/foo/bar',
);

Assert.equal(
  getInitialConfiguration()
    .extendWithData({
      output: { directory: 'foo' },
      main: 'bar/qux',
      cwd: '/base',
    })
    .fromRight()
    .getOutputPath(),
  '/base/foo/-base-bar-qux',
);

Assert.equal(
  getInitialConfiguration()
    .extendWithData({
      output: { directory: 'foo' },
      'map-name': 'bar/qux',
      cwd: '/base',
    })
    .fromRight()
    .getOutputPath(),
  '/base/foo/bar-qux',
);

/////////////////
// getMetaData //
/////////////////

Assert.equal(typeof getInitialConfiguration().getMetaData(), 'object');

Assert.equal(getInitialConfiguration().getMetaData().language.engine, null);

Assert.equal(
  getInitialConfiguration()
    .extendWithData({
      engine: 'foo@bar',
      cwd: '/',
    })
    .fromRight()
    .getMetaData().language.engine,
  'foo@bar',
);

////////////////
// spawnChild //
///////////////

{
  const configuration = getInitialConfiguration()
    .extendWithData({
      children: [['node', 'main.js']],
      cwd: '/',
    })
    .fromRight();
  setSpawnForTesting(() => ({ stdout: null, stderr: null }));
  Assert.deepEqual(
    configuration.spawnChild(configuration.getChilderen()[0]).fromRight(),
    { stdout: null, stderr: null },
  );
}

////////////
// Others //
////////////

Assert.equal(getInitialConfiguration().getBaseDirectory(), process.cwd());

Assert.equal(getInitialConfiguration().getEscapePrefix(), 'APPMAP');

Assert.equal(getInitialConfiguration().getLanguageVersion(), '2020');

Assert.equal(getInitialConfiguration().isClassMapPruned(), false);

Assert.equal(getInitialConfiguration().isEventPruned(), false);

Assert.equal(getInitialConfiguration().getConcurrency(), 1);

Assert.equal(getInitialConfiguration().getProtocol(), 'messaging');

Assert.equal(getInitialConfiguration().getHost(), 'localhost');

Assert.equal(getInitialConfiguration().getPort(), 0);

Assert.deepEqual(getInitialConfiguration().getChilderen(), []);

Assert.deepEqual(getInitialConfiguration().getHooks(), {
  esm: {},
  cjs: {},
  http: null,
  mysql: null,
  pg: null,
  sqlite3: null,
});

Assert.equal(typeof getInitialConfiguration().serialize(), 'string');
