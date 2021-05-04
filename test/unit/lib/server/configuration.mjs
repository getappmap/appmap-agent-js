import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { getDefaultConfiguration } from '../../../../lib/server/configuration.mjs';

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
  () => getDefaultConfiguration().extendWithFile('tmp/test/foo', process.cwd()),
  /^Error: ENOENT/,
);

FileSystem.writeFileSync('tmp/test/foo', '123', 'utf8');
Assert.throws(
  () => getDefaultConfiguration().extendWithFile('tmp/test/foo'),
  /^Error: invalid file extension/,
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ enabled: 123 }),
  'utf8',
);
Assert.throws(
  () => getDefaultConfiguration().extendWithFile('tmp/test/foo.json'),
  /^Error: invalid configuration/,
);

FileSystem.writeFileSync(
  'tmp/test/foo.json',
  JSON.stringify({ enabled: false }),
  'utf8',
);
Assert.ok(getDefaultConfiguration().extendWithFile('tmp/test/foo.json').data.enabled, true);

FileSystem.writeFileSync('tmp/test/foo.yml', 'enabled: true', 'utf8');
Assert.ok(getDefaultConfiguration().extendWithFile('tmp/test/foo.yml').data.enabled, true);

////////////////////
// extendWithData //
////////////////////

Assert.throws(
  () => getDefaultConfiguration().extendWithData({ extends: 'tmp/test/foo' }, null),
  /^Error: missing base to resolve path/,
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({ 'base-directory': '.' }, process.cwd()).data.git,
  getDefaultConfiguration().data.git,
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({ exclude: ['foo', 'bar'] }, process.cwd()).data
    .exclude,
  ['foo', 'bar'],
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({
    packages: ["raw"]
  }, '/base').data.packages,
  [{
    glob: 'raw',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  }]
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({
    packages: [{
      glob: "glob"
    }]
  }, '/base').data.packages,
  [{
    glob: 'glob',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  }]
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({
    packages: [{
      path: "path.js"
    }]
  }, '/base').data.packages,
  [{
    glob: 'path.js',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  }]
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({
    packages: [{
      path: "path"
    }]
  }, '/base').data.packages,
  [{
    glob: 'path/**/*',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  }]
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({
    packages: [{
      path: "path/"
    }]
  }, '/base').data.packages,
  [{
    glob: 'path/**/*',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  }]
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({
    packages: [{
      dist: "dist"
    }]
  }, '/base').data.packages,
  [{
    glob: 'node_module/dist/**/*',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  }]
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({
    packages: [{
      dist: {
        name: "dist",
        deep: true
      }
    }]
  }, '/base').data.packages,
  [{
    glob: '**/node_module/dist/**/*',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  }]
);

Assert.deepEqual(
  getDefaultConfiguration().extendWithData({
    packages: [{
      dist: {
        name: "dist",
        external: true
      }
    }]
  }, '/base').data.packages,
  [{
    glob: 'node_module/dist/**/*',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  },
  {
    glob: '../node_module/dist/**/*',
    base: '/base',
    shallow: false,
    enabled: true,
    exclude: []
  }]
);

///////////////
// isEnabled //
///////////////

Assert.throws(
  () => getDefaultConfiguration().isEnabled(),
  /^Error: missing main path for enabled query/
);

Assert.equal(
  getDefaultConfiguration().extendWithData({'main-path':'main.js'}, '/base').isEnabled(),
  true
);

// Assert.equal(
//   getDefaultConfiguration()
//     .extendWithData({ enabled: '*.js' }, '.')
//     .isEnabled('main.js'),
//   true,
// );
//
// Assert.equal(
//   getDefaultConfiguration()
//     .extendWithData({ enabled: '*.js' }, '.')
//     .extendWithData({ enabled: false }, null)
//     .isEnabled('main.js'),
//   false,
// );

/////////////
// Getters //
/////////////

Assert.equal(
  getDefaultConfiguration()
    .extendWithData({ 'escape-prefix': 'ESCAPE_PREFIX' }, null)
    .getEscapePrefix(),
  'ESCAPE_PREFIX',
);

Assert.equal(
  getDefaultConfiguration()
    .extendWithData({ 'output-file-name': 'foo' }, null)
    .getPath(),
  'tmp/appmap/foo',
);

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
