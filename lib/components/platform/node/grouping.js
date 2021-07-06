
const AsyncHooks = require("async_hooks");

let hook = null;

export const getCurrentGroup = AsyncHooks.executionAsyncId;

export const startGrouping = (linkGroup) => {
  assert(hook === null, "cannot start grouping");
  hook = AsyncHooks.createHook({
    init: (id, type, parent_id, resource) => {
      linkGroup(parent_id, id, type);
    },
  });
};

export const stopGrouping = () => {
  assert(hook !== null, "cannot stop grouping");
  hook.disable();
  hook = null;
};
