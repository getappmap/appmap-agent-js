
const {initializeCurl} = require("./curl.js");

const mapping = {
  __proto__: null,
  [1]: initializeHttp1,
  [2]: initializeHttp2
};

const initializeRequest = ({version, host, port}) => {
  assert(typeof port === "number" || host === "localhost" || host === "127.0.0.1", "expected localhost when provided a unix domain socket, got: %o", host);
  const {run} = initializeCurl(version, host, port);
  const {runAsync, terminate} = mapping[version](host, port);
  return {run, runAsync, terminate};
};

module.exports = () => {initializeRequest};
