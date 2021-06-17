
const {hook} = require("./async-hook.js");
const {log} = require("./async-hook-log.js");

const timeout2 = () => {
  log("timeout2");
  throw "BOUM";
};

const timeout1 = () => {
  log("timeout1");
  setTimeout(timeout2, 1000);
  setTimeout(timeout2, 1000);
}

log("foo");

setTimeout(timeout1, 1000);
setTimeout(timeout1, 1000);

log("bar");
