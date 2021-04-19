// import * as AsyncHooks from 'async_hooks';
// import * as FileSystem from "fs";
// import * as Util from "util"

const AsyncHooks = require("async_hooks");
const FileSystem = require("fs");
const Util = require("util");

const STDOUT = 1;

let counter = 0;

const log = (...args) => {
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

const hook = AsyncHooks.createHook({
  init: (asyncId, type, triggerAsyncId, resource) => {
    counter += 1;
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
  // before: trace("before"),
  // after: trace("after"),
  // destroy: trace("destroy"),
  // promiseResolve: trace("promiseResolve")
});

log(
  "executionAsyncId()=%i triggerAsyncId()=%i",
  AsyncHooks.executionAsyncId(),
  AsyncHooks.triggerAsyncId()
);

hook.enable();

FileSystem.writeFile("yo.txt", "foo", "utf8", (error) => {
  log("done");
  throw counter;
});
