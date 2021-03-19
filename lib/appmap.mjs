import * as Path from 'path';
import * as Fs from 'fs';
import * as Url from 'url';

import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

const APPMAP_VERSION = '1.4';

const client = Fs.readFileSync(
  Path.join(
    Path.dirname(new Url.URL(import.meta.url).pathname),
    '..',
    'package.json',
  ),
  'utf8',
);

export default (class AppMap {
  constructor(git, settings) {
    this.archived = false;
    this.settings = settings;
    this.json = {
      version: APPMAP_VERSION,
      metadata: {
        name: 'TODO',
        labels: ['TODO'],
        app: settings.getAppName(),
        feature: 'TODO',
        feature_group: 'TODO',
        language: {
          name: 'javascript',
          engine: null,
          version: 'ECMAScript2020',
        },
        client: {
          name: client.name,
          url: client.url,
          version: client.version,
        },
        recorder: {
          name: 'default',
        },
        recording: {
          defined_class: 'TODO',
          method_id: 'TODO',
        },
        git: git.isRepository()
          ? {
              repository: git.getRepositoryURL(),
              branch: git.getBranchName(),
              commit: git.getCommitHash(),
              status: git.getStatus(),
              tag: git.getLatestTag(),
              annotated_tag: git.getLatestAnnotatedTag(),
              commits_since_tag: git.getCommitNumberSinceLatestTag(),
              commits_since_annotated_tag: git.getCommitNumberSinceLatestAnnotatedTag(),
            }
          : null,
      },
      classMap: [],
      events: [],
    };
  }
  setEngine(name, version) {
    if (this.archived) {
      logger.error(
        `Trying to set the engine on an archived appmap, got: ${JSON.stringify({
          name,
          version,
        })}`,
      );
    } else {
      if (this.json.metadata.language.engine !== null) {
        logger.warning(
          `Overwritting of appmap.metadata.language.engine, got: ${JSON.stringify(
            { name, version },
          )}`,
        );
      }
      this.json.metadata.language.engine = `${name}@${version}`;
    }
  }
  addPackage(path, childeren) {
    if (this.archived) {
      logger.error(
        `Trying to add a package on an archived appmap, got: ${JSON.stringify({
          path,
          childeren,
        })}`,
      );
    } else {
      this.json.classMap.push({
        type: 'package',
        path,
        childeren,
      });
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
      this.json.events.push(event);
    }
  }
  archive(termination) {
    logger.info(`Termination: ${JSON.stringify(termination)}`);
    if (this.archived) {
      logger.error(
        `Trying to archive an already archived appmap, got: ${JSON.stringify(
          termination,
        )}`,
      );
    } else {
      this.archived = true;
      Fs.writeFileSync(
        Path.join(this.settings.getOutputDir(), this.json.metadata.name),
        JSON.stringify(this.json, null, 2),
        'utf8',
      );
    }
  }
});
