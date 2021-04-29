import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { getDefaultConfiguration } from '../../../../lib/server/configuration.mjs';

const configuration = getDefaultConfiguration();

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
Assert.throws(
  () => configuration.extendWithFile('tmp/test/foo', process.cwd()),
  /^Error: ENOENT/,
);

FileSystem.writeFileSync('tmp/test/foo', '123', 'utf8');
Assert.throws(
  () => configuration.extendWithFile('tmp/test/foo'),
  /^Error: invalid file extension/,
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ enabled: 123 }),
  'utf8',
);
Assert.throws(
  () => configuration.extendWithFile('tmp/test/foo.json'),
  /^Error: invalid configuration/,
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ enabled: true }),
  'utf8',
);
Assert.ok(configuration.extendWithFile('tmp/test/foo.json').data.enabled, true);

FileSystem.writeFileSync('tmp/test/foo.yml', 'enabled: true', 'utf8');
Assert.ok(configuration.extendWithFile('tmp/test/foo.yml').data.enabled, true);

////////////////////
// extendWithData //
////////////////////

Assert.throws(
  () => configuration.extendWithData({ extends: 'tmp/test/foo' }, null),
  /^Error: missing base to resolve path/,
);

Assert.deepEqual(
  configuration.extendWithData({ 'git-dir': '.' }, process.cwd()).data.git,
  configuration.data.git,
);

Assert.deepEqual(
  configuration.extendWithData({ exclude: ['foo', 'bar'] }, process.cwd()).data
    .exclude,
  ['foo', 'bar'],
);

Assert.deepEqual(
  configuration.extendWithData(
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
  ).data.packages,
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
  configuration.extendWithEnv(
    {
      APPMAP: 'TruE',
      APPMAP_BAR: 'qux',
    },
    '/foo',
  ).data.enabled,
  true,
);

Assert.deepEqual(
  configuration.extendWithEnv(
    {
      APPMAP_OUTPUT_DIR: 'bar',
    },
    '/foo',
  ).data.output,
  {
    dir: '/foo/bar',
    base: '/foo',
  },
);

Assert.deepEqual(
  configuration.extendWithEnv(
    {
      APPMAP_PACKAGES: ' bar , qux ',
    },
    '/foo',
  ).data.packages,
  configuration.extendWithData(
    {
      packages: ['bar', 'qux'],
    },
    '/foo',
  ).data.packages,
);

///////////////
// isEnabled //
///////////////

Assert.throws(
  () => getDefaultConfiguration().extendWithData({ enabled: '*.js' }, null),
  /^Error: missing base for glob/,
);

Assert.equal(getDefaultConfiguration().isEnabled('main.js'), true);

Assert.equal(
  getDefaultConfiguration()
    .extendWithData({ enabled: '*.js' }, '.')
    .isEnabled('main.js'),
  true,
);

Assert.equal(
  getDefaultConfiguration()
    .extendWithData({ enabled: '*.js' }, '.')
    .isEnabled('main.json'),
  false,
);

Assert.equal(
  getDefaultConfiguration()
    .extendWithData({ enabled: '*.js' }, '.')
    .extendWithData({ enabled: false }, null)
    .isEnabled('main.js'),
  false,
);

//
// Assert.equal(
//   getDefaultConfiguration()
//     .extendWithData({ enabled: false }, null)
//     .isEnabled(),
//   false,
// );
//
// Assert.equal(getDefaultConfiguration().checkEnabled(), undefined);
//
// Assert.throws(
//   () =>
//     getDefaultConfiguration()
//       .extendWithData({ enabled: false }, null)
//       .checkEnabled(),
//   /^Error: disabled configuration/,
// );

/////////////
// Getters //
/////////////

Assert.equal(
  configuration
    .extendWithData({ 'escape-prefix': 'ESCAPE_PREFIX' }, null)
    .getEscapePrefix(),
  'ESCAPE_PREFIX',
);

Assert.throws(() => configuration.getPath(), /^Error: missing main option/);

Assert.equal(
  configuration
    .extendWithData(
      { output: { dir: '/foo', base: '/bar' }, main: '/bar/qux.js' },
      '/',
    )
    .getPath(),
  '/foo/qux.js',
);

Assert.equal(
  configuration
    .extendWithData({ output: 'alongside', main: '/foo/bar.js' }, '/')
    .getPath(),
  '/foo/bar.js',
);

Assert.equal(
  configuration
    .extendWithData({ 'language-version': '5.1' }, null)
    .getLanguageVersion(),
  '5.1',
);

{
  Assert.equal(
    getDefaultConfiguration()
      .extendWithData({ main: 'main.js' }, '/foo')
      .getMetaData().name,
    '/foo/main.js',
  );
  const metadata = configuration
    .extendWithData(
      {
        'map-name': 'MAP_NAME',
        labels: ['LABEL0', 'LABEL1'],
        'app-name': 'APP_NAME',
        feature: 'FEATURE',
        'feature-group': 'FEATURE_GROUP',
        'language-engine': 'LANGUAGE_ENGINE',
        'language-version': '5.1',
        frameworks: [
          {
            name: 'FRAMEWORKS-0-NAME',
            version: 'FRAMEWORKS-0-version',
          },
        ],
        'recorder-name': 'RECORDER_NAME',
        'recording-defined-class': 'RECORDING_DEFINED_CLASS',
        'recording-method-id': 'RECORDING_METHOD_ID',
      },
      null,
    )
    .getMetaData();
  Assert.ok(Reflect.getOwnPropertyDescriptor(metadata, 'git') !== undefined);
  delete metadata.git;
  Assert.ok(Reflect.getOwnPropertyDescriptor(metadata, 'client') !== undefined);
  Assert.ok(
    Reflect.getOwnPropertyDescriptor(metadata.client, 'version') !== undefined,
  );
  delete metadata.client.version;
  Assert.deepEqual(metadata, {
    name: 'MAP_NAME',
    labels: ['LABEL0', 'LABEL1'],
    app: 'APP_NAME',
    feature: 'FEATURE',
    feature_group: 'FEATURE_GROUP',
    language: {
      name: 'javascript',
      engine: 'LANGUAGE_ENGINE',
      version: '5.1',
    },
    frameworks: [
      {
        name: 'FRAMEWORKS-0-NAME',
        version: 'FRAMEWORKS-0-version',
      },
    ],
    client: {
      name: '@appland/appmap-agent-js',
      url: 'https://github.com/applandinc/appmap-agent-js.git',
    },
    recorder: {
      name: 'RECORDER_NAME',
    },
    recording: {
      defined_class: 'RECORDING_DEFINED_CLASS',
      method_id: 'RECORDING_METHOD_ID',
    },
  });
}

////////////////////////////
// getFileInstrumentation //
////////////////////////////

Assert.equal(
  configuration
    .extendWithData({ enabled: true }, '/foo')
    .getFileInstrumentation('/foo/bar'),
  null,
);

Assert.equal(
  configuration
    .extendWithData({ enabled: true, packages: ['bar'] }, '/foo')
    .getFileInstrumentation('bar'),
  null,
);

Assert.equal(
  configuration
    .extendWithData({ enabled: true, packages: ['bar'] }, '/foo')
    .getFileInstrumentation('/foo/bar'),
  'deep',
);

Assert.equal(
  configuration
    .extendWithData(
      { enabled: true, packages: [{ path: 'bar', shallow: true }] },
      '/foo',
    )
    .getFileInstrumentation('/foo/bar'),
  'shallow',
);

//////////////////////
// isNameExcluded //
//////////////////////

Assert.equal(configuration.isNameExcluded('/foo/bar', 'name'), true);

Assert.equal(
  configuration
    .extendWithData({ enabled: true }, '/foo')
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  configuration
    .extendWithData(
      { enabled: true, packages: ['bar'], exclude: ['name'] },
      '/foo',
    )
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  configuration
    .extendWithData(
      { enabled: true, packages: [{ path: 'bar', exclude: ['name'] }] },
      '/foo',
    )
    .isNameExcluded('/foo/bar', 'name'),
  true,
);

Assert.equal(
  configuration
    .extendWithData({ enabled: true, packages: ['bar'] }, '/foo')
    .isNameExcluded('/foo/bar', 'name'),
  false,
);
