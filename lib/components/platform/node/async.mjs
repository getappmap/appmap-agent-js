
const AsyncHooks = require("async_hooks");

export const getCurrentAsync = AsyncHooks.executionAsyncId;

let hook = null;

export const start = ({linkAsync}) => {
  hook = AsyncHooks.createHook({
    init: (id, type, parent_id, resource) => {
      linkAsync(parent_id, id, type);
    },
  });
};

export const stop = () => {
  hook.disable();
  hook = null;
};
