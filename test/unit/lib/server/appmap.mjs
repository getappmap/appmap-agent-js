import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import { getDefaultConfig } from '../../../../lib/server/config.mjs';
import Appmap from '../../../../lib/server/appmap.mjs';

const appmap = new Appmap(getDefaultConfig(), {
  env: {
    APPMAP_OUTPUT_DIR: 'tmp/appmap',
    APPMAP_MAP_NAME: 'map-name',
  },
  engine: "engine",
  recorder: "recorder",
  feature: 'feature',
  labels: ['label'],
  frameworks: ['framework'],
  feature_group: 'feature-group',
  recording: 'recording',
});

appmap.instrument('source', 'path1', '({});');
appmap.emit('event1');
appmap.terminate('reason1');

Assert.throws(() => appmap.instrument('script', 'path2', 'content'));
Assert.throws(() => appmap.emit('event2'));
Assert.throws(() => appmap.terminate('reason2'));

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
    name: 'unknown-map-name',
    labels: ['label'],
    app: 'unknown-app-name',
    feature: 'feature',
    feature_group: 'feature-group',
    language: { name: 'javascript', engine: "engine", version: '2015' },
    frameworks: ['framework'],
    client: {
      name: '@appland/appmap-agent-js',
      url: 'https://github.com/applandinc/appmap-agent-js.git',
      version: '???',
    },
    recorder: "recorder",
    recording: 'recording',
  },
  classMap: [
    {
      type: 'package',
      name: 'path1',
      childeren: [{ type: 'class', name: '§none', childeren: [] }],
    },
  ],
  events: ['event1'],
});
