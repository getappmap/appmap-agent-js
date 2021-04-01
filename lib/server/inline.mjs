import Logger from './logger.mjs';
import Config from './config.mjs';
import git from './git.mjs';
import Namespace from './namespace.mjs';
import Appmap from './appmap.mjs';
import File from './file.mjs';
import instrument from './instrument/index.mjs';

const logger = new Logger(import.meta.url);

export default (env) => {
  const config = new Config(env);
  let appmap = null;
  const addEntity = (entity) => appmap.addEntity(entity);
  return {
    initialize: (data) => {
      if (appmap === null) {
        appmap = new Appmap(
          {
            name: data.name,
            labels: [],
            app: config.getAppName(),
            feature: null,
            feature_group: null,
            language: {
              name: 'javascript',
              engine: data.engine,
              version: data.ecmascript,
            },
            frameworks: [],
            recorder: 'inline',
            recording: null,
            git: git(config.getGitDirectory()),
          },
          new Namespace(data.prefix),
        );
      } else {
        logger.error(`duplicate initalization`);
      }
    },
    terminate: (reason) => {
      if (appmap === null) {
        logger.error(`terminate before initalization`);
      } else {
        appmap.archive(config.getOutputDir(), reason);
      }
    },
    instrumentScript: (content, path) => {
      if (appmap === null) {
        logger.error(`instrumentScript before initalization`);
        return content;
      }
      return instrument(
        new File(appmap.getLanguageVersion(), 'script', path, content),
        appmap.getNamespace(),
        addEntity,
      );
    },
    instrumentModule: (content, path, pending) => {
      if (appmap === null) {
        logger.error(`instrumentModule before initalization`);
        pending.resolve(content);
      } else {
        pending.resolve(
          new File(appmap.getLanguageVersion(), 'script', path, content),
          appmap.getNamespace(),
          addEntity,
        );
      }
    },
    emit: (event) => {
      if (appmap === null) {
        logger.error(`emit before initalization`);
      } else {
        appmap.addEvent(event);
      }
    },
  };
};
