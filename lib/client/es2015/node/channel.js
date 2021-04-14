/* eslint global-require: off */

const global_Object_assign = Object.assign;
const global_Error = Error;

const makers = {
  __proto__: null,
  messaging: (host, port) => ({
    requestAsync: require("./request/async/messaging.js")(host, port),
    requestSync: require("./request/sync/messaging.js")(host, port),
  }),
  http1: (host, port) => ({
    requestAsync: require("./request/async/http1.js")(host, port),
    requestSync: require("./request/sync/curl.js")("1.1", host, port),
  }),
  http2: (host, port) => ({
    requestAsync: require("./request/async/http2.js")(host, port),
    requestSync: require("./request/sync/curl.js")("2", host, port),
  }),
  http3: (host, port) => ({
    requestAsync: require("./request/async/http3.js")(host, port),
    requestSync: require("./request/sync/curl.js")("3", host, port),
  }),
};

module.exports = (env) => {
  env = global_Object_assign(
    {
      APPMAP_PROTOCOL: "messaging",
      APPMAP_HOST: "localhost",
      APPMAP_PORT: 0,
      APPMAP_PROTOCOL_TEST: null,
    },
    env
  );
  // if (env.APPMAP_PROTOCOL === "test") {
  //   /* eslint-disable import/no-dynamic-require */
  //   return require(env.APPMAP_PROTOCOL_TEST);
  //   /* eslint-enable import/no-dynamic-require */
  // }
  if (env.APPMAP_PROTOCOL === "inline") {
    return require("../../../../dist/inline.js")();
  }
  if (env.APPMAP_PROTOCOL in makers) {
    return makers[env.APPMAP_PROTOCOL](env.APPMAP_HOST, env.APPMAP_PORT);
  }
  throw new global_Error(
    `Invalid APPMAP_PROTOCOL, got: ${env.APPMAP_PROTOCOL}`
  );
};
