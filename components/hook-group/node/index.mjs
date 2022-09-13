import { createHook } from "async_hooks";

const { Set } = globalThis;

export default (dependencies) => {
  const {
    util: { assert },
    agent: { recordGroup },
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
            recordGroup(agent, id, description);
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
