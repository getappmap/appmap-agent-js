import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import { getDefaultConfig } from  "../../../../lib/server/config.mjs";
import Appmap from '../../../../lib/server/appmap.mjs';

const appmap = new Appmap();

appmap.instrument("source", "path1", "content");
appmap.emit("event1");
appmap.terminate("reason1");

appmap.initialize("recorder1", getDefaultConfig(), {
  env: {
    "APPMAP_OUTPUT_DIR": "tmp/appmap",
    "APPMAP_MAP_NAME": "map-name"
  },
  feature: "feature",
  labels: ["label"],
  frameworks: ["framework"],
  feature_group: "feature-group",
  recording: "recording",
});

appmap.initialize("recorder2", getDefaultConfig(), {env:{}});
appmap.instrument("script", "path2", "({});");
appmap.emit("event2");
appmap.terminate("reason2");

const json = JSON.parse(FileSystem.readFileSync("tmp/appmap/map-name.appmap.json", "utf8"));

Assert.equal(json.metadata.git.repository, "https://github.com/applandinc/appmap-agent-js");
delete json.metadata.git;

Assert.deepEqual(
  json,
  {
    version: '1.4',
    metadata: {
      name: 'unknown-map-name',
      labels: [ 'label' ],
      app: 'unknown-app-name',
      feature: 'feature',
      feature_group: 'feature-group',
      language: { name: 'javascript', version: '2015' },
      frameworks: [ 'framework' ],
      client: {
        name: '@appland/appmap-agent-js',
        url: 'https://github.com/applandinc/appmap-agent-js.git',
        version: '1.0.2'
      },
      recorder: { name: 'recorder1' },
      recording: 'recording',
    },
    classMap: [
      {
        type: 'package',
        name: 'path2',
        childeren: [ { type: 'class', name: '§none', childeren: [] } ]
      }
    ],
    events: [ 'event2' ]
  },
);


appmap.initialize("recorder3", getDefaultConfig(), {env:{
  APPMAP_OUTPUT_DIR: "foo/bar/qux",
}});
appmap.terminate("reason3");
