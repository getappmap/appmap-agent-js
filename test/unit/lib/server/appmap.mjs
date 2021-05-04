import { strict as Assert } from 'assert';
import * as Path from 'path';
import * as FileSystem from 'fs';
import { getDefaultConfiguration } from '../../../../lib/server/configuration.mjs';
import Appmap from '../../../../lib/server/appmap.mjs';

try {
  FileSystem.unlinkSync('tmp/appmap/main.js.appmap.json');
} catch (error) {
  if (error !== null) {
    Assert.equal(error.code, 'ENOENT');
  }
}

const cache = {__proto__:null};

// Assert.equal(
//   new Appmap(getDefaultConfiguration(), { __proto__: null }).instrument(
//     'script',
//     Path.resolve('./foo.js'),
//     '(function f () {} ())',
//   ),
//   '(function f () {} ())',
// );

const appmap = new Appmap(
  getDefaultConfiguration().extendWithData(
    {
      enabled: true,
      'map-name': 'map-nam1',
      packages: [
        {path: 'path1'},
        {dist: 'dist1'}
      ]
    },
    null,
  ),
  { __proto__: null },
);

appmap.instrument('script', Path.resolve('./path1'), '({});');
appmap.record('event1');
appmap.terminate(true, 'reason1');

Assert.throws(() => appmap.instrument('script', 'path2', 'content'));
Assert.throws(() => appmap.record('event2'));
Assert.throws(() => appmap.terminate(true, 'reason2'));

const json = JSON.parse(
  FileSystem.readFileSync('tmp/appmap/main.js.appmap.json', 'utf8'),
);

// Failing with travis: I guess that whether .git is included or not depends on the original git clone command
Assert.ok(
  json.metadata.git.repository ===
    'https://github.com/applandinc/appmap-agent-js.git' ||
    json.metadata.git.repository ===
      'https://github.com/applandinc/appmap-agent-js',
);
delete json.metadata.git;
delete json.metadata.client.version;

Assert.deepEqual(json, {
  version: '1.4',
  metadata: {
    name: Path.resolve('./main.js'),
    labels: [],
    app: null,
    feature: null,
    feature_group: null,
    language: { name: 'javascript', engine: null, version: '2015' },
    frameworks: [],
    client: {
      name: '@appland/appmap-agent-js',
      url: 'https://github.com/applandinc/appmap-agent-js.git',
    },
    recorder: {
      name: null,
    },
    recording: {
      defined_class: null,
      method_id: null,
    },
  },
  classMap: [
    {
      type: 'package',
      name: Path.resolve('./path1'),
      childeren: [{ type: 'class', name: '§none', childeren: [] }],
    },
  ],
  events: ['event1'],
});

new Appmap(getDefaultConfiguration().extendWithData({ main: 'main.js' }, '.'), {
  __proto__: null,
}).terminate(false, 'reason');

new Appmap(
  getDefaultConfiguration().extendWithEnv(
    {
      APPMAP_OUTPUT_DIR: 'tmp/missing/',
      APPMAP_MAIN: 'main.mjs',
    },
    '.',
  ),
  { __proto__: null },
).terminate(false, 'reason');

try {
  FileSystem.unlinkSync('./tmp/test/foo-1.appmap.json');
} catch (error) {
  Assert.equal(error.code, 'ENOENT');
}
new Appmap(
  getDefaultConfiguration().extendWithData(
    {
      output: {
        dir: 'tmp/test',
        base: '.',
      },
      main: './main.js',
    },
    '.',
  ),
  {
    __proto__: null,
    [Path.resolve('./tmp/test/main.js')]: null,
    [Path.resolve('./tmp/test/main.js-0')]: null,
  },
).terminate(true, 'reason');
FileSystem.readFileSync('./tmp/test/main.js-1.appmap.json');
