import * as Fs from 'fs';
import * as Assert from 'assert';
import Yaml from 'yaml';
import * as Logger from '../../lib/instrumenter/logger.mjs';
import Settings from '../../lib/instrumenter/settings.mjs';

Logger.reloadGlobalLevel('DEBUG');

const AssertStrict = Assert.strict;

const inputString = `#comment
name: appname
packages:
  - null
  - foo: bar
  - path: null
  - path: package1
  - path: package2
    shallow: true
  - path: package3
    shallow: false
  - path: package4
    shallow: null
exclude:
  - Class
  - Class#instanceMethod
  - Class.classMethod
  - null
`;

const inputObject = Yaml.parse(inputString);

const makeInvalid = (path, key) => {
  const object = { ...inputObject };
  object[key] = null;
  Fs.writeFileSync(path, Yaml.stringify(object), 'utf8');
  return { APPMAP_CONFIG: path };
};

const makeMissing = (path, key) => {
  const object = { ...inputObject };
  delete object[key];
  Fs.writeFileSync(path, Yaml.stringify(object), 'utf8');
  return { APPMAP_CONFIG: path };
};

Fs.writeFileSync('test/data/config/appmap.yml', inputString, 'utf8');

const prototype = {
  enabled: false,
  outdir: 'tmp/appmap/',
  appname: 'appname',
  exclusions: ['Class', 'Class#instanceMethod', 'Class.classMethod'],
  packages: [
    { path: 'package1', depth: Infinity },
    { path: 'package2', depth: 1 },
    { path: 'package3', depth: Infinity },
    { path: 'package4', depth: Infinity },
  ],
};

const makeFresh = (array, element) => {
  let index = 0;
  while (array.includes(`${element}${String(index)}`)) {
    index += 1;
  }
  return `${element}${String(index)}`;
};

const checkSettings = (settings, expected) => {
  AssertStrict.equal(settings.getOutputDir(), expected.outdir);
  AssertStrict.equal(settings.getAppName(), expected.appname);
  expected.exclusions.forEach((exclusion) => {
    AssertStrict.equal(settings.isExcluded('package', exclusion), true);
  });
  AssertStrict.equal(
    settings.isExcluded('package', makeFresh(expected.exclusions, 'Class')),
    false,
  );
  expected.packages.forEach(({ path, depth }) => {
    AssertStrict.equal(
      settings.getInstrumentationDepth(path),
      expected.enabled ? depth : 0,
    );
  });
  AssertStrict.equal(
    settings.getInstrumentationDepth(makeFresh(expected.packages, 'package')),
    0,
  );
};

[{ APPMAP: 'true' }, { APPMAP: 'TRUE' }].forEach((env) => {
  checkSettings(
    new Settings({
      ...env,
      APPMAP_CONFIG: 'test/data/config/appmap.yml',
      APPMAP_OUTPUT_DIR: 'appmap/output/dir/',
    }),
    {
      __proto__: prototype,
      outdir: 'appmap/output/dir/',
      enabled: true,
    },
  );
});

process.chdir('test/data/config/');
[{ APPMAP: 'false' }, { APPMAP: 'FALSE' }, { APPMAP: 'foobar' }, {}].forEach(
  (env) => {
    checkSettings(new Settings(env), prototype);
  },
);
process.chdir('../../../');

[
  {
    APPMAP_CONFIG: 'test/data/config/missing.yml',
  },
  {
    APPMAP_CONFIG:
      (Fs.writeFileSync('test/data/config/unparsable.yml', '- * -', 'utf8'),
      'test/data/config/unparsable.yml'),
  },
  {
    APPMAP_CONFIG:
      (Fs.writeFileSync('test/data/config/invalid.yml', 'null', 'utf8'),
      'test/data/config/invalid.yml'),
  },
].forEach((env) => {
  checkSettings(new Settings(env), {
    __proto__: prototype,
    appname: 'unknown',
    packages: [],
    exclusions: [],
  });
});

[
  makeInvalid('test/data/config/invalid-name.yml', 'name'),
  makeMissing('test/data/config/missing-name.yml', 'name'),
].forEach((env) => {
  checkSettings(new Settings(env), {
    __proto__: prototype,
    appname: 'unknown',
  });
});

[
  makeInvalid('test/data/config/invalid-packages.yml', 'packages'),
  makeMissing('test/data/config/missing-packages.yml', 'packages'),
].forEach((env) => {
  checkSettings(new Settings(env), {
    __proto__: prototype,
    packages: [],
  });
});

[
  makeInvalid('test/data/config/invalid-exclude.yml', 'exclude'),
  makeMissing('test/data/config/missing-exclude.yml', 'exclude'),
].forEach((env) => {
  checkSettings(new Settings(env), {
    __proto__: prototype,
    exclusions: [],
  });
});
