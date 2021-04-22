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

module.exports = ({ protocol, host, port }) => {
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
