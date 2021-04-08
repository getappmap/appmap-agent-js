
const HttpRequestSync = require("./util/http-request-sync.js");
const Http1RequestAsync = require("./util/http1-request-async.js");

module.exports = (env) => ({
  requestSync: HttpRequestSync("http1", env.APPMAP_HOST, env.APPMAP_PORT),
  requestAsync: Http1RequestAsync(env.APPMAP_HOST, env.APPMAP_PORT)
});
