import { writeFileSync } from 'fs';
import { strict as Assert } from 'assert';
import Yaml from 'yaml';
import * as Logger from '../../../../lib/server/logger.mjs';
import { getDefaultConfig } from '../../../../lib/server/config.mjs';

const config = getDefaultConfig();

config.extendWithPath('/foo');
config.extendWithPath('/foo.json');
config.extendWithPath('/foo.yml');
config.extendWithJson(123);
config.extendWithJson({ extend: 123 });
config.extendWithJson({ extend: '/foo' });
config.extendWithEnv({ APPMAP_CONFIG: '/foo' });

writeFileSync('tmp/test/conf.yml', 'name: foo', 'utf8');
Assert.equal(config.extendWithPath('tmp/test/conf.yml').getAppName(), 'foo');

writeFileSync('tmp/test/conf.json', '@foo', 'utf8');
config.extendWithPath('tmp/test/conf.json');

const makeMakeTest = (method) => (kind, key) => (value) =>
  config[`extendWith${kind}`]({ [key]: value })[method]();

// simple strings //
[
  ['getGitDir', 'APPMAP_GIT_DIR', 'git-dir', '.'],
  ['getOutputDir', 'APPMAP_OUTPUT_DIR', 'output-dir', 'tmp/appmap'],
  ['getAppName', 'APPMAP_APP_NAME', 'name', 'unknown-app-name'],
  ['getMapName', 'APPMAP_MAP_NAME', 'map-name', 'unknown-map-name'],
].forEach(([method, key1, key2, def]) => {
  const makeTest = makeMakeTest(method);
  {
    const test = makeTest('Env', key1);
    Assert.equal(test('foo'), 'foo');
  }
  {
    const test = makeTest('Json', key2);
    Assert.equal(test('foo'), 'foo');
    Assert.equal(test(123), def);
  }
});

// isEnabled //
{
  const def = false;
  const makeTest = makeMakeTest('isEnabled');
  {
    const test = makeTest('Env', 'APPMAP');
    Assert.equal(test('TruE'), true);
    Assert.equal(test('FalsE'), false);
    Assert.equal(test('foo'), def);
  }
  {
    const test = makeTest('Json', 'enabled');
    Assert.equal(test(true), true);
    Assert.equal(test(false), false);
    Assert.equal(test('foo'), def);
  }
}

// getEscapePrefix //
{
  const def = 'APPMAP';
  const makeTest = makeMakeTest('getEscapePrefix');
  {
    const test = makeTest('Env', 'APPMAP_ESCAPE_PREFIX');
    Assert.equal(test('foo'), 'foo');
    Assert.equal(test('@bar'), def);
  }
  {
    const test = makeTest('Json', 'escape-prefix');
    Assert.equal(test('foo'), 'foo');
    Assert.equal(test('@bar'), def);
    Assert.equal(test(123), def);
  }
}

// language_version //
{
  const def = '2015';
  const makeTest = makeMakeTest('getLanguageVersion');
  {
    const test = makeTest('Env', 'APPMAP_LANGUAGE_VERSION');
    Assert.equal(test('5'), '5');
    Assert.equal(test('foo'), def);
  }
  {
    const test = makeTest('Json', 'language-version');
    Assert.equal(test('5'), '5');
    Assert.equal(test('foo'), def);
    Assert.equal(test(5), def);
  }
}

// getPackages //
{
  const makeTest = makeMakeTest('getPackages');
  {
    const test = makeTest('Env', 'APPMAP_PACKAGES');
    Assert.deepEqual(test(' foo , bar '), [{ name: 'foo' }, { name: 'bar' }]);
  }
  {
    const test = makeTest('Json', 'packages');
    Assert.deepEqual(test([{ name: 'foo' }, 'bar']), [
      { name: 'foo' },
      { name: 'bar' },
    ]);
    Assert.deepEqual(test(123), []);
    Assert.deepEqual(test([456, {}, { name: 789 }, 'qux']), [{ name: 'qux' }]);
  }
}

// getExclusions //
{
  const makeTest = makeMakeTest('getExclusions');
  {
    const test = makeTest('Env', 'APPMAP_EXCLUDE');
    Assert.deepEqual(test(' foo , bar '), ['foo', 'bar']);
  }
  {
    const test = makeTest('Json', 'exclude');
    Assert.deepEqual(test(['foo', 'bar']), ['foo', 'bar']);
    Assert.deepEqual(test(123), []);
    Assert.deepEqual(test([456, 'qux']), ['qux']);
  }
}
