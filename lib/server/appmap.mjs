import * as Path from 'path';
import * as FileSystem from 'fs';
import * as Url from 'url';
import logger from './logger.mjs';
import Namespace from './namespace.mjs';
import git from './git.mjs';
import File from './file.mjs';
import instrument from './instrument/index.mjs';

const APPMAP_VERSION = '1.4';

const client = JSON.parse(FileSystem.readFileSync(
  Path.join(
    Path.dirname(Url.fileURLToPath(import.meta.url)),
    '..',
    '..',
    'package.json',
  ),
  'utf8',
));

export default (class Appmap {
  constructor() {
    this.state = null;
  }
  initialize(recorder, config, init) {
    if (this.state !== null) {
      logger.error('Appmap cannot be initialized because it is not idle');
    } else {
      this.state = {
        config: config.extendWithEnv(init.env),
        namespace: new Namespace(config.getEscapePrefix()),
        appmap: {
          version: APPMAP_VERSION,
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
            recorder: {
              name: recorder,
            },
            recording: init.recording,
            git: git(config.getGitDir()),
          },
          classMap: [],
          events: [],
        },
      };
    }
  }
  instrument(source, path, content) {
    if (this.state === null) {
      logger.error('Appmap cannot instrument code because it is idle');
      return content;
    }
    logger.info('Appmap instrument %s at %s', source, path);
    return instrument(
      new File(this.state.config.getLanguageVersion(), source, path, content),
      this.namespace,
      (entity) => {
        logger.info('Appmap register code entity: %j', entity);
        this.state.appmap.classMap.push(entity);
      },
    );
  }
  emit(event) {
    if (this.state === null) {
      logger.error(
        'Appmap cannot register event because it is idle; ignoring the event',
      );
    } else {
      logger.info('Appmap save event: %j', event);
      this.state.appmap.events.push(event);
    }
  }
  terminate(reason) {
    if (this.state === null) {
      logger.error('Appmap cannot be terminated because it is idle');
    } else {
      logger.info('Appmap terminate with: %j', reason);
      const path = Path.join(
        this.state.config.getOutputDir(),
        `${this.state.config.getMapName()}.appmap.json`,
      );
      const content = JSON.stringify(this.state.appmap);
      try {
        FileSystem.writeFileSync(path, content, 'utf8');
      } catch (error) {
        logger.error(
          'Appmap cannot be saved at %s because %s; outputing to stdout instead',
          path,
          error.message,
        );
        process.stdout.write(content, 'utf8');
        process.stdout.write('\n', 'utf8');
      } finally {
        this.state = null;
      }
    }
  }
});
