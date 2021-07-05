
const AsyncHooks = require("async_hooks");
const {noop, constant} = require("../../util/index.mjs");

const singleton = {
  getCurrentThreadId: constant(0),
  terminate: noop
};

exports.startThreading = (enabled, onNewThread) => {
  if (enabled) {
    let hook = AsyncHooks.createHook({
      init: (id, type, parent_id, resource) => {
        onNewThread({
          id,
          type,
          parent_id,
        });
      },
    });
    return {
      getCurrentThreadId: () => hook.executionAsyncId(),
      stopThreading: () => {
        hook.disable();
        hook = null;
      }
    };
  }
  return singleton;
};
