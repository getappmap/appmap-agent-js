import { strict as Assert } from 'assert';
import * as Fs from 'fs';
import * as ChildProcess from 'child_process';
import Git from '../../../lib/git.mjs';
import AppMap from '../../../lib/appmap.mjs';

const settings = {
  __proto__: null,
  getAppName(...args) {
    Assert.equal(this, settings);
    Assert.deepEqual(args, []);
    return 'myapp';
  },
  getOutputDir(...args) {
    Assert.equal(this, settings);
    Assert.deepEqual(args, []);
    return 'test/unit/env/appmap';
  },
};

{
  const git = {
    __proto__: null,
    isRepository(...args) {
      Assert.equal(this, git);
      Assert.deepEqual(args, []);
      return false;
    },
  };
  const appmap = new AppMap(git, settings);
  appmap.addPackage('path/to/file1.js', ['child1', 'child2']);
  appmap.setEngine('engine-name-1', 'engine-version-1');
  appmap.setEngine('engine-name-2', 'engine-version-2');
  appmap.addEvent('event1');
  appmap.addEvent('event2');
  appmap.archive('termination1');
  appmap.addPackage('path/to/file2.js', ['child3', 'child4']);
  appmap.setEngine('engine-name-3', 'engine-version-1');
  appmap.addEvent('event3');
  appmap.archive('termination2');
  const json = JSON.parse(Fs.readFileSync('test/unit/env/appmap/TODO', 'utf8'));
  Assert.deepEqual(json.classMap, [
    {
      type: 'package',
      path: 'path/to/file1.js',
      childeren: ['child1', 'child2'],
    },
  ]);
  Assert.equal(json.metadata.language.engine, 'engine-name-2@engine-version-2');
  Assert.deepEqual(json.events, ['event1', 'event2']);
}

{
  const url = 'https://github.com/lachrist/sample.git';
  const path = 'test/unit/env/git/';
  if (!Fs.readdirSync('test/unit/env/').includes('git')) {
    ChildProcess.execSync(`git clone ${url} test/unit/env/git/`);
  }
  const git = new Git(path);
  const appmap = new AppMap(git, settings);
  appmap.archive('termination1');
  const json = JSON.parse(Fs.readFileSync('test/unit/env/appmap/TODO', 'utf8'));
  Assert.equal(json.metadata.git.repository, url);
}
