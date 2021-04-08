
const ForkRequestAsync = require("util/fork-request-async.js");
const HttpRequestSync = require("util/http-request-sync.js");

module.exports = (env) => ({
  requestSync: HttpRequestSync("http2", `localhost:${env.APPMAP_PORT}`),
  requestAsync: ForkRequestAsync()
});
