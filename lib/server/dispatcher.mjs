import * as Path from 'path';
import Appmap from './appmap.mjs';
import { validateRequest } from './validate.mjs';

export default (class Dispatcher {
  constructor(config) {
    this.cache = { __proto__: null };
    this.config = config;
    this.appmaps = { __proto__: null };
  }
  dispatch(request) {
    validateRequest(request);
    if (request.name === 'initialize') {
      // console.log("initialize >>", "argv =" ,request.process.argv, "env =", request.process.env);
      let session;
      do {
        session = Math.random().toString(36).substring(2);
      } while (session in this.appmaps);
      let { config } = this;
      config = config.extendWithData(request.configuration, process.cwd());
      config = config.extendWithEnv(request.process.env, process.cwd());
      if (config.getMapName() === null) {
        config = config.extendWithData(
          { 'map-name': Path.relative(process.cwd(), request.process.argv[1]) },
          null,
        );
      }
      const appmap = new Appmap(config, this.cache);
      this.appmaps[session] = appmap;
      return {
        session,
        prefix: config.getEscapePrefix(),
      };
    }
    const appmap = this.appmaps[request.session];
    if (request.name === 'terminate') {
      console.log("terminate >> reason =", request.reason);
      appmap.terminate(request.sync, request.reason);
      delete this.appmaps[request.session];
      return null;
    }
    if (request.name === 'instrument') {
      // console.log("instrument >> path =", request.path);
      return appmap.instrument(request.source, request.path, request.content);
    }
    if (request.name === 'emit') {
      // console.log("emit >> event =", request.event);
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
