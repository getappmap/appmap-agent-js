// import * as AsyncHooks from 'async_hooks';
// import * as FileSystem from "fs";
// import * as Util from "util"

const {log} = require("./async-hook-log.js");
require("./async-hook.js");

const Http = require("http");

const server = Http.createServer();

server.listen(3000, () => {
  log("listening");
});

server.on("request", (req, res) => {
  log("responding");
  res.end("foo");
});
