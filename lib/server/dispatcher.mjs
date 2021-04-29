import * as Path from 'path';
import logger from './logger.mjs';
import Appmap from './appmap.mjs';
import { validateRequest } from './validate.mjs';

export default (class Dispatcher {
  constructor(configuration) {
    this.cache = { __proto__: null };
    this.configuration = configuration;
    this.appmaps = { __proto__: null };
  }
  dispatch(request) {
    validateRequest(request);
    if (request.name === 'initialize') {
      let { configuration } = this;
      configuration = configuration.extendWithData(
        request.configuration,
        process.cwd(),
      );
      configuration = configuration.extendWithEnv(
        request.process.env,
        process.cwd(),
      );
      if (!configuration.isEnabled(request.process.argv[1])) {
        logger.info(
          'initialize (disabled) process = %j configuration = %j',
          request.process,
          request.configuration,
        );
        return {
          session: null,
          prefix: null,
        };
      }
      if (configuration.getMapName() === null) {
        configuration = configuration.extendWithData(
          { 'map-name': Path.relative(process.cwd(), request.process.argv[1]) },
          null,
        );
      }
      let session;
      do {
        session = Math.random().toString(36).substring(2);
      } while (session in this.appmaps);
      logger.info(
        'initialize %s process = %j configuration = %j',
        session,
        request.process,
        configuration.data,
      );
      const appmap = new Appmap(configuration, this.cache);
      this.appmaps[session] = appmap;
      return {
        session,
        prefix: configuration.getEscapePrefix(),
      };
    }
    const appmap = this.appmaps[request.session];
    if (request.name === 'terminate') {
      logger.info('terminate %s %j', request.session, request.reason);
      appmap.terminate(request.sync, request.reason);
      delete this.appmaps[request.session];
      return null;
    }
    if (request.name === 'instrument') {
      logger.info(
        'instrument %s %s %s',
        request.session,
        request.source,
        request.path,
      );
      return appmap.instrument(request.source, request.path, request.content);
    }
    if (request.name === 'record') {
      logger.info(
        'record %s %s %i',
        request.session,
        request.event.event,
        request.event.id,
      );
      appmap.record(request.event);
      return null;
    }
    /* c8 ignore start */
    throw new Error('invalid request name');
    /* c8 ignore stop */
  }
});
