import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { getDefaultConfig } from '../../../../lib/server/config.mjs';

const config = getDefaultConfig();

////////////////////
// extendWithFile //
////////////////////

try {
  FileSystem.unlinkSync('tmp/test/foo');
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}
Assert.ok(
  config
    .extendWithFile('tmp/test/foo', process.cwd())
    .startsWith('failed to read conf file'),
);

FileSystem.writeFileSync('tmp/test/foo', '123', 'utf8');
Assert.ok(
  config.extendWithFile('tmp/test/foo').startsWith('failed to parse conf file'),
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ enabled: 'foo' }),
  'utf8',
);
Assert.ok(
  config
    .extendWithFile('tmp/test/foo.json')
    .startsWith('invalid configuration'),
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ enabled: true }),
  'utf8',
);
Assert.ok(config.extendWithFile('tmp/test/foo.json').conf.enabled, true);

FileSystem.writeFileSync('tmp/test/foo.yml', 'enabled: true', 'utf8');
Assert.ok(config.extendWithFile('tmp/test/foo.yml').conf.enabled, true);

/////////////////////
// extendsWithJson //
/////////////////////

try {
  FileSystem.unlinkSync('tmp/test/foo');
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}
Assert.ok(
  config
    .extendWithJson({ extends: 'tmp/test/foo' }, process.cwd())
    .startsWith('failed to read conf file'),
);

Assert.equal(
  config.extendWithJson({ 'git-dir': 'bar' }, '/foo').conf['git-dir'],
  '/foo/bar',
);

Assert.deepEqual(
  config.extendWithJson({ exclude: ['foo', 'bar'] }, process.cwd()).conf
    .exclude,
  ['foo', 'bar'],
);

Assert.deepEqual(
  config.extendWithJson(
    {
      packages: [
        'dist-or-path',
        {
          dist: 'dist',
        },
        {
          path: 'shallow-path',
          shallow: true,
        },
        {
          path: 'deep-path',
        },
      ],
    },
    '/foo',
  ).conf.packages,
  [
    {
      shallow: false,
      path: '/foo/node_modules/dist-or-path',
      dist: 'dist-or-path',
      exclude: [],
    },
    {
      shallow: false,
      path: '/foo/node_modules/dist',
      dist: 'dist',
      exclude: [],
    },
    {
      shallow: false,
      path: '/foo/dist-or-path',
      dist: 'dist-or-path',
      exclude: [],
    },
    {
      shallow: true,
      path: '/foo/shallow-path',
      dist: null,
      exclude: [],
    },
    { shallow: false, path: '/foo/deep-path', dist: null, exclude: [] },
  ],
);

///////////////////
// extendWithEnv //
///////////////////

Assert.equal(
  config.extendWithEnv(
    {
      APPMAP: 'TruE',
      APPMAP_BAR: 'qux',
    },
    '/foo',
  ).conf.enabled,
  true,
);

Assert.deepEqual(
  config.extendWithEnv(
    {
      APPMAP_PACKAGES: ' bar , qux ',
    },
    '/foo',
  ).conf.packages,
  config.extendWithJson(
    {
      packages: ['bar', 'qux'],
    },
    '/foo',
  ).conf.packages,
);

/////////////
// Getters //
/////////////

Assert.equal(config.getEscapePrefix(), 'APPMAP');

Assert.equal(config.getGitDir(), '.');

Assert.equal(config.getOutputDir(), 'tmp/appmap');

Assert.equal(config.getAppName(), 'unknown-app-name');

Assert.equal(config.getMapName(), 'unknown-map-name');

Assert.equal(config.getLanguageVersion(), 'es2015');

////////////////////////////
// getFileInstrumentation //
////////////////////////////

Assert.equal(
  config
    .extendWithJson({ packages: ['bar'] }, '/foo')
    .getFileInstrumentation('/foo/bar'),
  null,
);

Assert.equal(
  config
    .extendWithJson({ enabled: true }, '/foo')
    .getFileInstrumentation('/foo/bar'),
  null,
);

Assert.equal(
  config
    .extendWithJson({ enabled: true, packages: ['bar'] }, '/foo')
    .getFileInstrumentation('bar'),
  null,
);

Assert.equal(
  config
    .extendWithJson({ enabled: true, packages: ['bar'] }, '/foo')
    .getFileInstrumentation('/foo/bar'),
  'deep',
);

Assert.equal(
  config
    .extendWithJson(
      { enabled: true, packages: [{ path: 'bar', shallow: true }] },
      '/foo',
    )
    .getFileInstrumentation('/foo/bar'),
  'shallow',
);

//////////////////////
// isNameExcluded //
//////////////////////

Assert.equal(config.isNameExcluded('/foo/bar', 'name'), true);

Assert.equal(
  config
    .extendWithJson({ enabled: true }, '/foo')
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  config
    .extendWithJson(
      { enabled: true, packages: ['bar'], exclude: ['name'] },
      '/foo',
    )
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  config
    .extendWithJson(
      { enabled: true, packages: [{ path: 'bar', exclude: ['name'] }] },
      '/foo',
    )
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  config
    .extendWithJson({ enabled: true, packages: ['bar'] }, '/foo')
    .isNameExcluded('/foo/bar', 'name'),
  false,
);
