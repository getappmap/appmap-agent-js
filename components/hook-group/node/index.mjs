import { createHook } from "async_hooks";

export default (dependencies) => {
  const {
    frontend: { declareGroup, setCurrentGroup },
    client: { sendClient },
  } = dependencies;
  return {
    hookGroup: (client, frontend, { hooks: { group } }) => {
      if (!group) {
        return null;
      }
      const hook = createHook({
        init: (group, description, origin) => {
          sendClient(
            client,
            declareGroup(frontend, { group, description, origin }),
          );
        },
        before: (group) => {
          setCurrentGroup(frontend, group);
        },
      });
      hook.enable();
      return hook;
    },
    unhookGroup: (hook) => {
      if (hook !== null) {
        hook.disable();
      }
    },
  };
};
