
const {hook} = require("./async-hook.js");
const {log} = require("./async-hook-log.js");

log("foo")
new Promise((resolve, reject) => {
  log("bar");
  resolve("yolo");
});
log("qux")
