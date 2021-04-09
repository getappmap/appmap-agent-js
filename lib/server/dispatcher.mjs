import Appmap from './appmap.mjs';

const checkHas = (object, key) => {
  if (Reflect.getOwnPropertyDescriptor(object, key) === undefined) {
    throw new Error(`Missing property: ${String(key)}`);
  }
};

const checkNotNull = (any) => {
  if (any === null) {
    throw new Error('Unexpected null');
  }
};

const checkTypeof = (value, type) => {
  if (typeof value !== type) {
    throw new Error(
      `Invalid value type: expected a ${type} and got a ${typeof value}`,
    );
  }
};

const checkAnyof = (value, values) => {
  if (!values.includes(value)) {
    throw new Error('Invalid enumeration-based value');
  }
};

const sources = ['script', 'module'];

export default (class Dispatcher {
  constructor(config) {
    this.config = config;
    this.appmaps = { __proto__: null };
  }
  dispatch(json) {
    checkTypeof(json, 'object');
    checkNotNull(json);
    checkHas(json, 'name');
    if (json.name === 'initialize') {
      checkHas(json, 'init');
      checkTypeof(json.init, 'object');
      checkNotNull(json);
      checkHas(json, 'env');
      checkTypeof(json.init, 'object');
      checkNotNull(json);
      let session;
      do {
        session = Math.random().toString(36).substring(2);
      } while (session in this.appmaps);
      const config = this.config.extendWithEnv(json.env);
      const appmap = new Appmap(config, json.init);
      this.appmaps[session] = appmap;
      return {
        session,
        prefix: config.getEscapePrefix(),
      };
    }
    checkHas(json, 'session');
    checkTypeof(json.session, 'string');
    checkHas(this.appmaps, json.session);
    const appmap = this.appmaps[json.session];
    if (json.name === 'terminate') {
      checkHas(json, 'reason');
      appmap.terminate(json.reason);
      delete this.appmaps[json.session];
      return null;
    }
    if (json.name === 'instrument') {
      checkHas(json, 'source');
      checkHas(json, 'path');
      checkHas(json, 'content');
      checkAnyof(json.source, sources);
      checkTypeof(json.path, 'string');
      checkTypeof(json.content, 'string');
      return appmap.instrument(json.source, json.path, json.content);
    }
    if (json.name === 'emit') {
      checkHas(json, 'event');
      appmap.emit(json.event);
      return null;
    }
    throw new Error('Unrecognized name');
  }
});
