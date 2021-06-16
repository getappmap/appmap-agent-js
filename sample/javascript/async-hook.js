// import * as AsyncHooks from 'async_hooks';
// import * as FileSystem from "fs";
// import * as Util from "util"

const AsyncHooks = require("async_hooks");
const FileSystem = require("fs");
const Util = require("util");

const STDOUT = 1;

let buffer = "";

const log = (...args) => {
  // buffer += `${Util.format(...args)}${"\n"}`;
  FileSystem.writeSync(STDOUT, `${Util.format(...args)}${"\n"}`);
  // FileSystem.fsyncSync(STDOUT);
};

const trace = (name) => (asyncId) => {
  log(
    "%s >> executionAsyncId()=%i triggerAsyncId()=%i asyncId=%i ",
    name,
    AsyncHooks.executionAsyncId(),
    AsyncHooks.triggerAsyncId(),
    asyncId,
  );
};

let counter = 0;
let current = counter

const hook = AsyncHooks.createHook({
  init: (asyncId, type, triggerAsyncId, resource) => {
    log(
      "init >> executionAsyncId()=%i triggerAsyncId()=%i asyncId=%i type=%s triggerAsyncId=%i resource=%o",
      AsyncHooks.executionAsyncId(),
      AsyncHooks.triggerAsyncId(),
      asyncId,
      type,
      triggerAsyncId,
      resource
    );
  },
  before: () => {
    counter += 1;
    current = counter;
  }
  // before: trace("before"),
  // after: trace("after"),
  // destroy: trace("destroy"),
  // promiseResolve: trace("promiseResolve")
});

const loc = () => log(
  "eid=%i tid=%i, loc=%i",
  AsyncHooks.executionAsyncId(),
  AsyncHooks.triggerAsyncId(),
  current
);

hook.enable();

loc();

console.log(process);

setInterval(loc, 1000);

// FileSystem.writeFile("yo.txt", "foo", "utf8", (error) => {
//   // log("done");
//   // throw buffer;
//   // throw counter;
// });
