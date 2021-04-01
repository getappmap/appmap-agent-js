import * as Path from 'path';
import * as FileSystem from 'fs';
import { URL } from 'url';

import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

const APPMAP_VERSION = '1.4';

const client = FileSystem.readFileSync(
  Path.join(
    Path.dirname(new URL(import.meta.url).pathname),
    '..',
    '..',
    'package.json',
  ),
  'utf8',
);

export default (class AppMap {
  constructor(metadata, namespace) {
    this.namespace = namespace;
    this.archived = false;
    this.entities = [];
    this.events = [];
    this.metadata = {
      name: '???',
      labels: [],
      app: '???',
      feature: '???',
      feature_group: '???',
      language: {
        name: 'javascript',
        version: '???',
        engine: '???',
      },
      frameworks: [],
      client: {
        name: client.name,
        url: client.url,
        version: client.version,
      },
      recorder: {
        name: '???',
      },
      recording: null,
      git: null,
      ...metadata,
    };
  }
  getLanguageVersion() {
    return this.metadata.language.version;
  }
  getNamespace() {
    return this.namespace;
  }
  addEntity(entity) {
    if (this.archived) {
      logger.error(
        `Trying to add a code entity on an archived appmap, got: ${JSON.stringify(
          entity,
        )}`,
      );
    } else {
      this.entities.push(entity);
    }
  }
  addEvent(event) {
    if (this.archived) {
      logger.error(
        `Trying to add an event on an archived appmap, got: ${JSON.stringify(
          event,
        )}`,
      );
    } else {
      this.events.push(event);
    }
  }
  archive(dirname, termination) {
    logger.info(`Termination: ${JSON.stringify(termination)}`);
    if (this.archived) {
      logger.error(
        `Trying to archive an already archived appmap, got: ${JSON.stringify(
          termination,
        )}`,
      );
    } else {
      this.archived = true;
      FileSystem.writeFileSync(
        Path.join(dirname, `${this.metadata.name}.appmap.json`),
        JSON.stringify(
          {
            version: APPMAP_VERSION,
            metadata: this.metadata,
            classMap: this.entities,
            events: this.events,
          },
          null,
          2,
        ),
        'utf8',
      );
    }
  }
});
