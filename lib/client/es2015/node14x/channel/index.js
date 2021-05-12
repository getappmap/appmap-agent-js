/* eslint global-require: off */
/* eslint import/no-dynamic-require: off */

const global_Error = Error;

const protocols = {
  __proto__: null,
  messaging: null,
  http1: null,
  http2: null,
  http3: null,
};

exports.makeChannel = (protocol, host, port) => {
  if (typeof protocol !== "string") {
    return protocol;
  }
  if (protocol === "inline") {
    return require("../../../../../dist/inline.js").makeChannel();
  }
  if (protocol in protocols) {
    return {
      requestSync: require(`./request-sync/${protocol}.js`)(host, port),
      request: require(`./request/${protocol}.js`)(
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
  throw new global_Error(`invalid protocol: ${protocol}`);
};
