/* eslint global-require: off */
/* eslint import/no-dynamic-require: off */

const global_Object_assign = Object.assign;
const global_Reflect_apply = Reflect.apply;
const global_RegExp_prototype_test = RegExp.prototype.test;
const global_Error = Error;
const global_parseInt = parseInt;

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
      APPMAP_PORT: "0",
    },
    env
  );
  const protocol = env.APPMAP_PROTOCOL;
  const host = env.APPMAP_HOST;
  let port = env.APPMAP_PORT;
  if (global_Reflect_apply(global_RegExp_prototype_test, /^[0-9]+$/, [port])) {
    port = global_parseInt(port);
  }
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
      requestAsync: require(`./request/async/${protocol}.js`)(
        host,
        port,
        /* c8 ignore start */ (error) => {
          if (error !== null) {
            throw error;
          }
        } /* c8 ignore stop */
      ),
    };
  }
  throw new global_Error(
    `Invalid APPMAP_PROTOCOL environment variable, got: ${protocol}`
  );
};
