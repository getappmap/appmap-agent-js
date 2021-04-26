import Appmap from './appmap.mjs';
import { validateRequest } from './validate.mjs';

export default (class Dispatcher {
  constructor(config) {
    this.config = config;
    this.appmaps = { __proto__: null };
  }
  dispatch(request) {
    validateRequest(request);
    if (request.name === 'initialize') {
      let session;
      do {
        session = Math.random().toString(36).substring(2);
      } while (session in this.appmaps);
      const config = this.config
        .extendWithData(request.configuration, process.cwd())
        .extendWithEnv(request.process.env, process.cwd());
      const appmap = new Appmap(config);
      this.appmaps[session] = appmap;
      return {
        session,
        prefix: config.getEscapePrefix(),
      };
    }
    const appmap = this.appmaps[request.session];
    if (request.name === 'terminate') {
      appmap.terminate(request.sync, request.reason);
      delete this.appmaps[request.session];
      return null;
    }
    if (request.name === 'instrument') {
      return appmap.instrument(request.source, request.path, request.content);
    }
    if (request.name === 'emit') {
      appmap.emit(request.event);
      return null;
    }
    /* c8 ignore start */
    throw new Error(
      'This should never happen: invalid name which passed validation',
    );
    /* c8 ignore stop */
  }
});
