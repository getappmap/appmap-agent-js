import { createHook } from "async_hooks";

export default (dependencies) => {
  const {
    state: { declareGroup, setCurrentGroup },
    client: { sendClient },
  } = dependencies;
  return {
    hookGroupAsync: async (promise, client, state, { hooks: group }) => {
      if (group) {
        const hook = createHook({
          init: (group, description, origin) => {
            sendClient(
              client,
              declareGroup(state, { group, description, origin }),
            );
          },
          before: (group) => {
            setCurrentGroup(state, group);
          },
        });
        hook.enable();
        try {
          await promise;
        } finally {
          hook.disable();
        }
      }
    },
  };
};
