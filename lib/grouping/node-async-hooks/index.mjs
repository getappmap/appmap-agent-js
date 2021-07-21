import { executionAsyncId, createHook } from "async_hooks";

const _Map = Map;

export default (dependencies) => {
  return {
    initializeGrouping: () => {
      const cache = new _Map();
      const hook = createHook({
        init: (group, description, origin) => {
          cache.set(group, { description, origin });
        },
        destroy: (group) => {
          cache.delete(group);
        },
      });
      hook.enable();
      return { cache, hook };
    },
    terminateGrouping: ({ hook }) => {
      hook.disable();
    },
    getCurrentGroup: ({ cache }) => {
      const group = executionAsyncId();
      if (cache.has(group)) {
        const { description, origin } = cache.get(group);
        cache.delete(group);
        return { group, description, origin };
      }
      return group;
    },
  };
};
