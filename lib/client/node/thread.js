const AsyncHooks = require("async_hooks");

exports.getCurrentThreadId = AsyncHooks.executionAsyncId;

exports.hookThread = (makeCouple) => {
  let hook = AsyncHooks.createHook({
    init: (id, type, parent_id, resource) => {
      const couple = makeCouple();
      couple.recordCall({
        defined_class: "EventLoop",
        method_id: "jump",
        static: true,
        child_thread_id: id,
        child_thread_type: type,
      });
      couple.recordReturn({});
    },
  });
  hook.enable();
  return () => {
    hook.disable();
    hook = null;
  };
};
