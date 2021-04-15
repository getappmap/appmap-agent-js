/* eslint global-require: off */
/* eslint import/no-dynamic-require: off */

const global_Object_assign = Object.assign;
const global_Error = Error;

// const makers = {
//   __proto__: null,
//   messaging: (host, port) => ({
//     requestAsync: require("./request/async/messaging.js")(host, port),
//     requestSync: require("./request/sync/messaging.js")(host, port),
//   }),
//   http1: (host, port) => ({
//     requestAsync: require("./request/async/http1.js")(host, port),
//     requestSync: require("./request/sync/curl.js")("1.1", host, port),
//   }),
//   http2: (host, port) => ({
//     requestAsync: require("./request/async/http2.js")(host, port),
//     requestSync: require("./request/sync/curl.js")("2", host, port),
//   }),
//   http3: (host, port) => ({
//     requestAsync: require("./request/async/http3.js")(host, port),
//     requestSync: require("./request/sync/curl.js")("3", host, port),
//   }),
// };

const protocols = {
  __proto__: null,
  messaging: null,
  http1: null,
  http2: null,
  http3: null,
};

module.exports = (env) => {
  env = global_Object_assign(
    {
      APPMAP_PROTOCOL: "messaging",
      APPMAP_HOST: "localhost",
      APPMAP_PORT: 0,
    },
    env
  );
  const protocol = env.APPMAP_PROTOCOL;
  const host = env.APPMAP_HOST;
  const port = env.APPMAP_PORT;
  // Avoid warnings due to invalid configuration keys
  delete env.APPMAP_PROTOCOL;
  delete env.APPMAP_HOST;
  delete env.APPMAP_PORT;
  if (typeof protocol !== "string") {
    const { requestSync, requestAsync } = protocol;
    return { inline: false, env, requestSync, requestAsync };
  }
  if (protocol === "inline") {
    const {
      requestSync,
      requestAsync,
    } = require("../../../../dist/inline.js")();
    return { inline: true, env, requestSync, requestAsync };
  }
  if (protocol in protocols) {
    return {
      inline: false,
      env,
      requestSync: require(`./request/sync/${protocol}.js`)(host, port),
      requestAsync: require(`./request/async/${protocol}.js`)(host, port),
    };
  }
  throw new global_Error(
    `Invalid APPMAP_PROTOCOL environment variable, got: ${protocol}`
  );
};
