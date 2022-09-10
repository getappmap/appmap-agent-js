import { createHook } from "async_hooks";

const {Set} = globalThis;

export default (dependencies) => {
  const {
    util: { assert },
    agent: {
      getFreshTab,
      recordBeginEvent,
      recordEndEvent,
      formatGroupPayload,
      formatUngroupPayload,
    },
  } = dependencies;
  return {
    hook: (agent, { ordering }) => {
      if (ordering !== "causal") {
        return null;
      } else {
        const groups = new Set();
        const hook = createHook({
          init: (id, description, _origin) => {
            assert(!groups.has(id), "duplicate async id");
            groups.add(id);
            const tab = getFreshTab(agent);
            recordBeginEvent(
              agent,
              tab,
              formatGroupPayload(agent, id, description),
            );
            recordEndEvent(agent, tab, formatUngroupPayload(agent, id));
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
