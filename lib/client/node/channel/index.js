/* eslint global-require: off */
/* eslint import/no-dynamic-require: off */

const { expect } = require("../check.js");

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
  // We ignore this for client / server separation
  /* c8 ignore start */
  if (protocol === "inline") {
    return require("../../../../dist/inline.js").makeChannel();
  }
  /* c8 ignore stop */
  expect(protocol in protocols, "invalid protocol: %j", protocol);
  return {
    request: require(`./request/${protocol}.js`).makeRequest(host, port),
    requestAsync: require(`./request-async/${protocol}.js`).makeRequestAsync(
      host,
      port
    ),
  };
};
