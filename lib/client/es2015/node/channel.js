/* eslint global-require: off */
/* eslint import/no-dynamic-require: off */

const global_Object_assign = Object.assign;
const global_Error = Error;

const mapping = {
  __proto__: null,
  "1.0": ["http1.0", "1"],
  "1.1": ["http1.1", "1"]
  "2": ["http2-prior-knowledge", "2"],
  "2.0": ["http2-prior-knowledge", "2"]
  "3": ["http3", "3"]
};

module.exports = (env) => {
  env = global_Object_assign(
    {
      __proto__: null,
      APPMAP_CHANNEL: "inline",
      APPMAP_HTTP_VERSION: "1.1",
      APPMAP_HOST: "localhost",
      APPMAP_PORT: "8080"
    }, env);
  if (env.APPMAP_CHANNEL[0] === "/") {
    return require(env.APPMAP_CHANNEL);
  }
  if (env.APPMAP_CHANNEL === "inline") {
    return require("../../../../dist/inline-channel.js")();
  }
  if (!(env.APPMAP_HTTP_VERSION in mapping)) {
    throw new global_Error(`Invalid APPMAP_HTTP_VERSION environment variable, got: ${env.APPMAP_HTTP_VERSION}`);
  }
  const requestSync = require("./request/curl-sync.js")(mapping[env.APPMAP_HTTP_VERSION][0], env.APPMAP_HOST, env.APPMAP_PORT);
  let requestAsync;
  if (env.APPMAP_CHANNEL === "http") {
    requestAsync = require(`./request/http${mapping[env.APPMAP_HTTP_VERSION][1]}-async.js`)(env.APPMAP_HOST, env.APPMAP_PORT);
  } else if (env.APPMAP_CHANNEL === "fork") {
    requestAsync = require(`./request/fork-async.js`)();
  } else {
    throw new global_Error(`Invalid APPMAP_CHANNEL environment variable, got: ${env.APPMAP_CHANNEL}`);
  }
  return {
    requestSync,
    requestAsync
  };
};
