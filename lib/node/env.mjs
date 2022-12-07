const {
  Reflect: { defineProperty },
} = globalThis;

const define = (object, key, value) => {
  defineProperty(object, key, {
    __proto__: null,
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

export const updateEnvEndpoint = (env, configuration) => {
  define(env, "APPMAP_LOG_FILE", configuration.log.file);
  define(env, "APPMAP_LOG_LEVEL", configuration.log.level);
  define(env, "APPMAP_SOCKET", configuration.socket);
};
