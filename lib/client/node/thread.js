const AsyncHooks = require("async_hooks");
// const {assert} = require("./check.js");
// const FileSystem = require("fs");

// exports.getCurrentThreadId = AsyncHooks.executionAsyncId;

exports.hookThread = (recordThread) => {
  let current = 0;
  let hook = AsyncHooks.createHook({
    init: (id, type, parent_id, resource) => {
      recordThread(parent_id, id, type);
    },
    before: (id) => {
      current = id;
    },
    // after: (id) => {
    //   FileSystem.writeSync(1, `after >> ${id}${"\n"}`, 'utf8');
    //   assert(current === id, "asynchronous id mismatch");
    //   current = null;
    // }
  });
  hook.enable();
  return {
    disable: () => {
      hook.disable();
      hook = null;
    },
    getCurrentThreadId: () => current,
  };
};
