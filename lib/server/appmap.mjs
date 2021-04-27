import * as Path from 'path';
import * as FileSystem from 'fs';
import logger from './logger.mjs';
import File from './file.mjs';
import instrument from './instrument/index.mjs';
import Namespace from './namespace.mjs';

const sanitize = (name) =>
  name === null ? 'anonymous' : name.replace(/\0|\//g, '-');

const VERSION = '1.4';

export default (class Appmap {
  constructor(config) {
    this.config = config;
    this.namespace = new Namespace(config.getEscapePrefix());
    this.terminated = false;
    this.appmap = {
      version: VERSION,
      metadata: config.getMetaData(),
      classMap: [],
      events: [],
    };
  }
  instrument(source, path, content) {
    if (this.terminated) {
      throw new Error(`Terminated appmap can no longer instrument code`);
    }
    const instrumentation = this.config.getFileInstrumentation(path);
    if (instrumentation === null) {
      return content;
    }
    return instrument(
      new File(this.config.getLanguageVersion(), source, path, content),
      this.namespace,
      (name) => this.config.isNameExcluded(path, name),
      (entity) => {
        logger.info('Appmap receive code entity: %j', entity);
        this.appmap.classMap.push(entity);
      },
    );
  }
  emit(event) {
    if (this.terminated) {
      throw new Error('Terminated appmap can no longer receive events');
    }
    logger.info('Appmap receive event: %j', event);
    this.appmap.events.push(event);
  }
  terminate(sync, json) {
    if (this.terminated) {
      throw new Error('Terminated appmap can no longer be terminated');
    }
    this.terminated = true;
    const path = Path.join(
      this.config.getOutputDir(),
      `${sanitize(this.config.getMapName())}.appmap.json`,
    );
    logger.info(
      'Appmap terminate sync = %j path = %s reason = %j',
      sync,
      path,
      json,
    );
    if (sync) {
      FileSystem.writeFileSync(path, JSON.stringify(this.appmap), 'utf8');
    } else {
      FileSystem.writeFile(
        path,
        JSON.stringify(this.appmap),
        'utf8',
        (error) => {
          if (error !== null) {
            logger.error(
              `Could not write appmap to %s >> $s`,
              path,
              error.message,
            );
          } else {
            logger.info('Appmap written to %', path);
          }
        },
      );
    }
  }
});
