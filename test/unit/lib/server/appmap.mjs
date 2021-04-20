import { strict as Assert } from 'assert';
import * as Path from 'path';
import * as FileSystem from 'fs';
import { getDefaultConfig } from '../../../../lib/server/config.mjs';
import Appmap from '../../../../lib/server/appmap.mjs';

try {
  FileSystem.unlinkSync('tmp/appmap/map-name.appmap.json');
} catch (error) {
  if (error !== null) {
    Assert.equal(error.code, 'ENOENT');
  }
}

Assert.equal(
  new Appmap(getDefaultConfig()).instrument(
    'script',
    Path.resolve(process.cwd(), 'foo.js'),
    '(function f () {} ())',
  ),
  '(function f () {} ())',
);

const appmap = new Appmap(
  getDefaultConfig().extendWithEnv(
    {
      APPMAP: 'true',
      APPMAP_PACKAGES: 'path1',
      APPMAP_OUTPUT_DIR: 'tmp/appmap',
      APPMAP_MAP_NAME: 'map-name',
    },
    process.cwd(),
  ),
  {
    engine: 'engine',
    recorder: 'recorder',
    feature: 'feature',
    labels: ['label'],
    frameworks: ['framework'],
    feature_group: 'feature-group',
    recording: 'recording',
  },
);

appmap.instrument('script', Path.resolve(process.cwd(), 'path1'), '({});');
appmap.emit('event1');
appmap.terminate(true, 'reason1');

Assert.throws(() => appmap.instrument('script', 'path2', 'content'));
Assert.throws(() => appmap.emit('event2'));
Assert.throws(() => appmap.terminate(true, 'reason2'));

const json = JSON.parse(
  FileSystem.readFileSync('tmp/appmap/map-name.appmap.json', 'utf8'),
);

// I guess the .git is based on the git clone command (failling with travis)
Assert.ok(
  json.metadata.git.repository ===
    'https://github.com/applandinc/appmap-agent-js.git' ||
    json.metadata.git.repository ===
      'https://github.com/applandinc/appmap-agent-js',
);
delete json.metadata.git;

Assert.deepEqual(json, {
  version: '1.4',
  metadata: {
    name: 'map-name',
    labels: ['label'],
    app: 'unknown-app-name',
    feature: 'feature',
    feature_group: 'feature-group',
    language: { name: 'javascript', engine: 'engine', version: 'es2015' },
    frameworks: ['framework'],
    client: {
      name: '@appland/appmap-agent-js',
      url: 'https://github.com/applandinc/appmap-agent-js.git',
      version: '???',
    },
    recorder: 'recorder',
    recording: 'recording',
  },
  classMap: [
    {
      type: 'package',
      name: Path.resolve(process.cwd(), 'path1'),
      childeren: [{ type: 'class', name: '§none', childeren: [] }],
    },
  ],
  events: ['event1'],
});

new Appmap(getDefaultConfig(), {}).terminate(false, 'reason');

new Appmap(
  getDefaultConfig().extendWithEnv(
    {
      APPMAP_OUTPUT_DIR: 'tmp/missing/',
    },
    process.cwd(),
  ),
  {},
).terminate(false, 'reason');
