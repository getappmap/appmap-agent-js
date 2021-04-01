import * as Fs from 'fs';
import { strict as Assert } from 'assert';
import Yaml from 'yaml';
import * as Logger from '../../../../lib/server/logger.mjs';
import Config from '../../../../lib/server/config.mjs';

Logger.reloadGlobalLevel('CRITICAL');

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

Fs.writeFileSync('tmp/test/appmap.yml', inputString, 'utf8');

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

const checkConfig = (config, expected) => {
  Assert.equal(config.getOutputDir(), expected.outdir);
  Assert.equal(config.getAppName(), expected.appname);
  expected.exclusions.forEach((exclusion) => {
    Assert.equal(config.isExcluded('package', exclusion), true);
  });
  Assert.equal(
    config.isExcluded('package', makeFresh(expected.exclusions, 'Class')),
    false,
  );
  expected.packages.forEach(({ path, depth }) => {
    Assert.equal(
      config.getInstrumentationDepth(path),
      expected.enabled ? depth : 0,
    );
  });
  Assert.equal(
    config.getInstrumentationDepth(makeFresh(expected.packages, 'package')),
    0,
  );
};

[{ APPMAP: 'true' }, { APPMAP: 'TRUE' }].forEach((env) => {
  checkConfig(
    new Config({
      ...env,
      APPMAP_CONFIG: 'tmp/test/appmap.yml',
      APPMAP_OUTPUT_DIR: 'appmap/output/dir/',
    }),
    {
      __proto__: prototype,
      outdir: 'appmap/output/dir/',
      enabled: true,
    },
  );
});

process.chdir('tmp/test/');
[{ APPMAP: 'false' }, { APPMAP: 'FALSE' }, { APPMAP: 'foobar' }, {}].forEach(
  (env) => {
    checkConfig(new Config(env), prototype);
  },
);
process.chdir('../../');

[
  {
    APPMAP_CONFIG: 'tmp/test/missing.yml',
  },
  {
    APPMAP_CONFIG:
      (Fs.writeFileSync('tmp/test/unparsable.yml', '- * -', 'utf8'),
      'tmp/test/unparsable.yml'),
  },
  {
    APPMAP_CONFIG:
      (Fs.writeFileSync('tmp/test/invalid.yml', 'null', 'utf8'),
      'tmp/test/invalid.yml'),
  },
].forEach((env) => {
  checkConfig(new Config(env), {
    __proto__: prototype,
    appname: 'unknown',
    packages: [],
    exclusions: [],
  });
});

[
  makeInvalid('tmp/test/invalid-name.yml', 'name'),
  makeMissing('tmp/test/missing-name.yml', 'name'),
].forEach((env) => {
  checkConfig(new Config(env), {
    __proto__: prototype,
    appname: 'unknown',
  });
});

[
  makeInvalid('tmp/test/invalid-packages.yml', 'packages'),
  makeMissing('tmp/test/missing-packages.yml', 'packages'),
].forEach((env) => {
  checkConfig(new Config(env), {
    __proto__: prototype,
    packages: [],
  });
});

[
  makeInvalid('tmp/test/invalid-exclude.yml', 'exclude'),
  makeMissing('tmp/test/missing-exclude.yml', 'exclude'),
].forEach((env) => {
  checkConfig(new Config(env), {
    __proto__: prototype,
    exclusions: [],
  });
});
