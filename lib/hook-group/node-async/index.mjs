import { executionAsyncId, createHook } from "async_hooks";

export default (dependencies) => {
  const {
    frontend:{declareGroup, setCurrentGroup},
    client:{sendClient},
  } = dependencies;
  return {
    hookGroupAsync: async ({promise, client, frontend, options}) => {
      const hook = createHook({
        init: (group, description, origin) => {
          sendClient(client, declareGroup(frontend, {group, description, origin}));
        },
        before: (group) => {
          setCurrentGroup(frontend, group);
        },
      });
      hook.enable();
      try {
        await promise;
      } finally {
        hook.disable();
      }
    },
  };
};
