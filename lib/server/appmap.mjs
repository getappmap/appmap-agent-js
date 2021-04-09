import * as Path from 'path';
import * as FileSystem from 'fs';
import logger from './logger.mjs';
import Namespace from './namespace.mjs';
import git from './git.mjs';
import File from './file.mjs';
import instrument from './instrument/index.mjs';

const VERSION = '1.4';

// Getting the right version:
//
// import { home } from '../../home.js';
// npx rollup --plugin commonjs
// const client = JSON.parse(
//   FileSystem.readFileSync(Path.join(home, 'package.json'), 'utf8'),
// );

const client = {
  name: '@appland/appmap-agent-js',
  repository: {
    type: 'git',
    url: 'https://github.com/applandinc/appmap-agent-js.git',
  },
  version: '???',
};

export default (class Appmap {
  constructor(config, json) {
    const init = {
      env: [],
      feature: null,
      feature_group: null,
      labels: [],
      frameworks: [],
      recorder: null,
      recording: null,
      engine: null,
      ...json,
    };
    this.config = config.extendWithEnv(init.env);
    this.namespace = new Namespace(config.getEscapePrefix());
    this.terminated = false;
    this.appmap = {
      version: VERSION,
      metadata: {
        name: config.getMapName(),
        labels: init.labels,
        app: config.getAppName(),
        feature: init.feature,
        feature_group: init.feature_group,
        language: {
          name: 'javascript',
          engine: init.engine,
          version: config.getLanguageVersion(),
        },
        frameworks: init.frameworks,
        client: {
          name: client.name,
          url: client.repository.url,
          version: client.version,
        },
        recorder: init.recorder,
        recording: init.recording,
        git: git(config.getGitDir()),
      },
      classMap: [],
      events: [],
    };
  }
  instrument(source, path, content) {
    if (this.terminated) {
      throw new Error(`Terminated appmap can no longer instrument code`);
    }
    return instrument(
      new File(this.config.getLanguageVersion(), source, path, content),
      this.namespace,
      (entity) => {
        logger.info('Appmap register code entity: %j', entity);
        this.appmap.classMap.push(entity);
      },
    );
  }
  emit(event) {
    if (this.terminated) {
      throw new Error('Terminated appmap can no longer receive events');
    }
    this.appmap.events.push(event);
  }
  terminate(reason) {
    if (this.terminated) {
      throw new Error('Terminated appmap can no longer be terminated');
    }
    this.terminated = true;
    FileSystem.writeFileSync(
      Path.join(
        this.config.getOutputDir(),
        `${this.config.getMapName()}.appmap.json`,
      ),
      JSON.stringify(this.appmap),
      'utf8',
    );
  }
});
