
import {executionAsyncId, createHook} from "async_hooks";

export default (dependencies) => {
  const {util:{createBox, setBox, getBox}} = dependencies;
  return {
    initializeGrouping: (state, init) => {
      const cache = new _Map();
      return {
        cache,
        hook: createHook({init: (group, description, origin) => {
          cache.set(group, {description, origin});
        }}),
      };
    },
    takeGroupingBuffer: ({box}) => {
      const buffer = getBox(box);
      const {length} = buffer;
      if (length === 0) {
        return null;
      }
      setBox(box, []);
      return buffer;
    },
    getCurrentGroup: ({cache}) => {
      const group = executionAsyncId();
      const
      return
    },
    terminateGrouping: ({hook}) => {
      hook.disable();
    },
  };
};
