require("./async-hook.js");
const {log} = require("./async-hook-log.js");
const {AsyncResource} = require("async_hooks");

const asyncResource = new AsyncResource(
  "FOO", { requireManualDestroy: false }
);

asyncResource.runInAsyncScope(() => {
  log("yo");
  throw "BOUM";
}, undefined, []);
