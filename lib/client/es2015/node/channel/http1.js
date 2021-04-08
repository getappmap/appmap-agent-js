
const HttpRequestSync = require("./util/http-request-sync.js");
const Http2RequestAsync = require("./util/http2-request-async.js");

module.exports = (env) => ({
  requestSync: HttpRequestSync("http2", env.APPMAP_HOST, env.APPMAP_PORT),
  requestAsync: Http2RequestAsync(env.APPMAP_HOST, env.APPMAP_PORT)
});
