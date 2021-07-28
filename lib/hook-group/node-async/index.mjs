import { createHook } from "async_hooks";

export default (dependencies) => {
  const {
    state: { declareGroup, setCurrentGroup },
    client: { sendClient, asyncClientTermination },
  } = dependencies;
  return {
    hookGroupAsync: async (client, state, { hooks: group }) => {
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
          await asyncClientTermination(client);
        } finally {
          hook.disable();
        }
      }
    },
  };
};
