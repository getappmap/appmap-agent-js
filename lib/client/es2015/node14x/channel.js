/* eslint global-require: off */
/* eslint import/no-dynamic-require: off */

const global_Error = Error;
const global_Reflect_apply = Reflect.apply;
const global_RegExp_prototype_test = RegExp.prototype.test;
const global_parseInt = parseInt;
const global_Object_assign = Object.assign;

const protocols = {
  __proto__: null,
  messaging: null,
  http1: null,
  http2: null,
  http3: null,
};

module.exports = (env) => {
  const options = global_Object_assign(
    {
      APPMAP_PROTOCOL: "messaging",
      APPMAP_HOST: "localhost",
      APPMAP_PORT: "8080",
    },
    env
  );
  if (
    global_Reflect_apply(global_RegExp_prototype_test, /^[0-9]+$/, [
      options.APPMAP_PORT,
    ])
  ) {
    options.APPMAP_PORT = global_parseInt(options.APPMAP_PORT);
  }
  const {
    APPMAP_PROTOCOL: protocol,
    APPMAP_HOST: host,
    APPMAP_PORT: port,
  } = options;
  if (typeof protocol !== "string") {
    const { requestSync, requestAsync } = protocol;
    return { inline: false, requestSync, requestAsync };
  }
  if (protocol === "inline") {
    const {
      requestSync,
      requestAsync,
    } = require("../../../../dist/inline.js").makeChannel();
    return { inline: true, requestSync, requestAsync };
  }
  if (protocol in protocols) {
    return {
      inline: false,
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
