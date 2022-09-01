import { createHook } from "async_hooks";

export default (dependencies) => {
  const {
    util: { assert },
    agent: {
      getFreshTab,
      recordBeginEvent,
      recordEndEvent,
      formatGroupPayload,
      getUngroupPayload,
    },
  } = dependencies;
  return {
    hook: (agent, { ordering }) => {
      if (ordering !== "causal") {
        return null;
      } else {
        const ungroup_payload = getUngroupPayload(agent);
        const groups = new Set();
        const hook = createHook({
          init: (id, description, origin) => {
            assert(!groups.has(id), "duplicate async id");
            groups.add(id);
            const tab = getFreshTab(agent);
            recordBeginEvent(
              agent,
              tab,
              formatGroupPayload(agent, id, description),
            );
            recordEndEvent(agent, tab, ungroup_payload);
          },
        });
        hook.enable();
        return hook;
      }
    },
    unhook: (hook) => {
      if (hook !== null) {
        hook.disable();
      }
    },
  };
};
