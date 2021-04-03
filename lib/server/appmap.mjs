import * as Path from 'path';
import { writeFileSync } from 'fs';
import { fileURLtoPath } from 'url';

import Logger from './logger.mjs';

const APPMAP_VERSION = '1.4';

const client = FileSystem.readFileSync(
  Path.join(
    Path.dirname(fileURLtoPath(import.meta)),
    '..',
    '..',
    'package.json',
  ),
  'utf8',
);

export default (class Appmap {
  constructor (recorder, conf, init) {
    this.state = null
  },
  initialize (recorder, config, init) {
    if (this.state !== null) {
      logger.error("Cannot initialize the appmap: ignoring the initialization >> the appmap is not idle");
    } else {
      this.state = {
        config: config.extendWithEnv(init.env),
        namespace: new Namespace(config.getEscapePrefix());
        appmap: {
          version: APPMAP_VERSION,
          metadata: {
            name: conf.getMapName(),
            labels: init.labels,
            app: conf.getAppName(),
            feature: init.feature,
            feature_group: init.feature_group,
            language: {
              name: 'javascript',
              engine: init.engine,
              version: conf.getLanguageVersion(),
            },
            frameworks: init.frameworks,
            client: {
              name:
              url:
              version:
            }
            recorder: {
              name: recorder,
            },
            recording: init.recording,
            git: git(conf.getGitDir()),
          },
          classMap: [],
          events: []
        },
      };
    }
  }
  instrument (source, path, content) {
    if (this.state === null) {
      logger.error("Cannot use appmap to instrument: returning the original code >> the appmap is idle");
      return content;
    }
    logger.info("Instrument %s %s", source, path);
    return instrument(
      new File(this.state.config.getLanguageVersion(), source, path, content),
      this.namespace,
      (entity) => {
        logger.info("Receive code entity: %j", entity);
        this.state.appmap.classMap.push(entity);
      }
    );
  }
  emit (event) {
    if (this.state === null) {
      logger.error("Cannot emit event to appmap: ignoring the event >> the appmap is idle")
    } else {
      logger.info("Receive event: %j", event);
      this.state.appmap.event.push(event);
    }
  }
  terminate (reason) {
    if (this.state === null) {
      logger.error("Cannot terminate appmap: ignoring the termination >> the appmap is idle")
    } else {
      logger.info("Terminate with: %j", reason);
      const path = Path.join(this.state.config.getOutputDir(), `${this.state.config.getMapName()}.appmap.json`);
      const content = JSON.stringify(this.state.appmap);
      try {
        writeFileSync(path, content, "utf8");
      } catch (error) {
        logger.error()
      }
      this.state.appmap.event.push(event);
    }
  }
