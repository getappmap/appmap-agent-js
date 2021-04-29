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
  constructor(configuration, cache) {
    this.cache = cache;
    this.configuration = configuration;
    this.namespace = new Namespace(configuration.getEscapePrefix());
    this.terminated = false;
    this.appmap = {
      version: VERSION,
      metadata: configuration.getMetaData(),
      classMap: [],
      events: [],
    };
  }
  instrument(source, path, content) {
    if (this.terminated) {
      throw new Error(`Terminated appmap can no longer instrument code`);
    }
    const instrumentation = this.configuration.getFileInstrumentation(path);
    if (instrumentation === null) {
      return content;
    }
    return instrument(
      new File(this.configuration.getLanguageVersion(), source, path, content),
      this.namespace,
      (name) => this.configuration.isNameExcluded(path, name),
      (entity) => {
        logger.info('Appmap receive code entity: %j', entity);
        this.appmap.classMap.push(entity);
      },
    );
  }
  record(event) {
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
    let path = Path.join(
      this.configuration.getOutputDir(),
      `${sanitize(this.configuration.getMapName())}`,
    );
    if (path in this.cache) {
      let counter = 0;
      while (`${path}-${String(counter)}` in this.cache) {
        counter += 1;
      }
      path = `${path}-${String(counter)}`;
    }
    this.cache[path] = null;
    path = `${path}.appmap.json`;
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
