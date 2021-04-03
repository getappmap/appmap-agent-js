import * as Fs from 'fs';
import { strict as Assert } from 'assert';
import Yaml from 'yaml';
import * as Logger from '../../../../lib/server/logger.mjs';
import { getDefaultConfig } from '../../../../lib/server/config.mjs';


// enabled: DEFAULT_ENABLED,
// app_name: DEFAULT_APP_NAME,
// map_name: DEFAULT_MAP_NAME,
// git_dir: DEFAULT_GIT_DIR,
// language_version: DEFAULT_LANGUAGE_VERSION,
// escape_prefix: DEFAULT_ESCAPE_PREFIX,
// output_dir: DEFAULT_OUTPUT_DIR,
// packages: [],
// exclude: [],

// isEnabled //
{
  const config1 = getDefaultConfig();
  const config2 = config1.extendWithEnv({APPMAP: "TruE"});
  Assert.deepEqual(config1.isEnabled(), false);
  Assert.deepEqual(config2.isEnabled(), true);
  Assert.deepEqual(config2.extendWithEnv({APPMAP: "FalsE"}).isEnabled(), false);
  Assert.deepEqual(config2.extendWithEnv({APPMAP: "foo"}).isEnabled(), false);
  Assert.deepEqual(config1.extendWithJson({enabled: true}).isEnabled(), true);
  Assert.deepEqual(config2.extendWithJson({enabled: false}).isEnabled(), false);
  Assert.deepEqual(config2.extendWithJson({enabled: "foo"}).isEnabled(), false);
}

// getAppName //
{
  const def = "unknown-app-name";
  const config1 = getDefaultConfig();
  const config2 = config1.extendWithEnv({APPMAP_APP_NAME: "foo"});
  Assert.deepEqual(config1.getAppName(), def);
  Assert.deepEqual(config2.getAppName(), "foo");
  Assert.deepEqual(config2.extendWithJson({name: "foo"}).getAppName(), "foo");
  Assert.deepEqual(config2.extendWithJson({name: 123}).getAppName(), def);
}

// getEscapePrefix //
{
  const def = "APPMAP";
  const config1 = getDefaultConfig();
  const config2 = config1.extendWithEnv({APPMAP_ESCAPE_PREFIX: "foo"});
  Assert.deepEqual(config1.getEscapePrefix(), def);
  Assert.deepEqual(config2.getEscapePrefix(), "foo");
  Assert.deepEqual(config2.extendWithEnv({APPMAP_ESCAPE_PREFIX: "@bar"}).getEscapePrefix(), def);
  Assert.deepEqual(config1.extendWithJson({"escape-prefix": "qux"}).getEscapePrefix(), "qux");
  Assert.deepEqual(config2.extendWithJson({"escape-prefix": 123}).getEscapePrefix(), def);
}

// language_version
{
  const def = "2015";
  const config1 = getDefaultConfig();
  const config2 = config1.extendWithEnv({APPMAP_LANGUAGE_VERSION: "5"});
  Assert.deepEqual(config1.getLanguageVersion(), def);
  Assert.deepEqual(config2.getLanguageVersion(), "5");
  Assert.deepEqual(config2.extendWithEnv({APPMAP_LANGUAGE_VERSION: "foo"}).getLanguageVersion(), def);
  Assert.deepEqual(config1.extendWithJson({"language-version": "5"}).getLanguageVersion(), "5");
  Assert.deepEqual(config2.extendWithJson({"language-version": "bar"}).getLanguageVersion(), def);
}

// Logger.reloadGlobalLevel('CRITICAL');

// const inputString = `
// #comment
// name: appname
// packages:
//   - null
//   - foo: bar
//   - path: null
//   - path: package1
//   - path: package2
//     shallow: true
//   - path: package3
//     shallow: false
//   - path: package4
//     shallow: null
// exclude:
//   - Class
//   - Class#instanceMethod
//   - Class.classMethod
//   - null
// `;



// const inputObject = Yaml.parse(inputString);
//
// const makeInvalid = (path, key) => {
//   const object = { ...inputObject };
//   object[key] = null;
//   Fs.writeFileSync(path, Yaml.stringify(object), 'utf8');
//   return { APPMAP_CONFIG: path };
// };
//
// const makeMissing = (path, key) => {
//   const object = { ...inputObject };
//   delete object[key];
//   Fs.writeFileSync(path, Yaml.stringify(object), 'utf8');
//   return { APPMAP_CONFIG: path };
// };
//
// Fs.writeFileSync('tmp/test/appmap.yml', inputString, 'utf8');
//
// const prototype = {
//   enabled: false,
//   outdir: 'tmp/appmap/',
//   appname: 'appname',
//   exclusions: ['Class', 'Class#instanceMethod', 'Class.classMethod'],
//   packages: [
//     { path: 'package1', depth: Infinity },
//     { path: 'package2', depth: 1 },
//     { path: 'package3', depth: Infinity },
//     { path: 'package4', depth: Infinity },
//   ],
// };
//
// const makeFresh = (array, element) => {
//   let index = 0;
//   while (array.includes(`${element}${String(index)}`)) {
//     index += 1;
//   }
//   return `${element}${String(index)}`;
// };
//
// const checkConfig = (config, expected) => {
//   Assert.equal(config.getOutputDir(), expected.outdir);
//   Assert.equal(config.getAppName(), expected.appname);
//   expected.exclusions.forEach((exclusion) => {
//     Assert.equal(config.isExcluded('package', exclusion), true);
//   });
//   Assert.equal(
//     config.isExcluded('package', makeFresh(expected.exclusions, 'Class')),
//     false,
//   );
//   expected.packages.forEach(({ path, depth }) => {
//     Assert.equal(
//       config.getInstrumentationDepth(path),
//       expected.enabled ? depth : 0,
//     );
//   });
//   Assert.equal(
//     config.getInstrumentationDepth(makeFresh(expected.packages, 'package')),
//     0,
//   );
// };
//
// [{ APPMAP: 'true' }, { APPMAP: 'TRUE' }].forEach((env) => {
//   checkConfig(
//     new Config({
//       ...env,
//       APPMAP_CONFIG: 'tmp/test/appmap.yml',
//       APPMAP_OUTPUT_DIR: 'appmap/output/dir/',
//     }),
//     {
//       __proto__: prototype,
//       outdir: 'appmap/output/dir/',
//       enabled: true,
//     },
//   );
// });
//
// process.chdir('tmp/test/');
// [{ APPMAP: 'false' }, { APPMAP: 'FALSE' }, { APPMAP: 'foobar' }, {}].forEach(
//   (env) => {
//     checkConfig(new Config(env), prototype);
//   },
// );
// process.chdir('../../');
//
// [
//   {
//     APPMAP_CONFIG: 'tmp/test/missing.yml',
//   },
//   {
//     APPMAP_CONFIG:
//       (Fs.writeFileSync('tmp/test/unparsable.yml', '- * -', 'utf8'),
//       'tmp/test/unparsable.yml'),
//   },
//   {
//     APPMAP_CONFIG:
//       (Fs.writeFileSync('tmp/test/invalid.yml', 'null', 'utf8'),
//       'tmp/test/invalid.yml'),
//   },
// ].forEach((env) => {
//   checkConfig(new Config(env), {
//     __proto__: prototype,
//     appname: 'unknown',
//     packages: [],
//     exclusions: [],
//   });
// });
//
// [
//   makeInvalid('tmp/test/invalid-name.yml', 'name'),
//   makeMissing('tmp/test/missing-name.yml', 'name'),
// ].forEach((env) => {
//   checkConfig(new Config(env), {
//     __proto__: prototype,
//     appname: 'unknown',
//   });
// });
//
// [
//   makeInvalid('tmp/test/invalid-packages.yml', 'packages'),
//   makeMissing('tmp/test/missing-packages.yml', 'packages'),
// ].forEach((env) => {
//   checkConfig(new Config(env), {
//     __proto__: prototype,
//     packages: [],
//   });
// });
//
// [
//   makeInvalid('tmp/test/invalid-exclude.yml', 'exclude'),
//   makeMissing('tmp/test/missing-exclude.yml', 'exclude'),
// ].forEach((env) => {
//   checkConfig(new Config(env), {
//     __proto__: prototype,
//     exclusions: [],
//   });
// });
