import { createHook } from "async_hooks";

export default (dependencies) => {
  const {
    util: { assert },
    agent: {
      recordBeginBundle,
      recordEndBundle,
      recordBeforeJump,
      recordAfterJump,
    },
  } = dependencies;
  return {
    hook: (agent, { ordering }) => {
      if (ordering !== "causal") {
        return null;
      }
      const groups = new Map();
      // It appears nested asynchronous operations are possible...
      // So we need a stack instead of a scalar.
      const stack = [];
      const hook = createHook({
        init: (id, description, origin) => {
          assert(!groups.has(id), "duplicate async id");
          groups.set(id, {
            bundle_index: recordBeginBundle(agent, null),
            jump_index: recordBeforeJump(agent, null),
          });
        },
        destroy: (id) => {
          if (groups.has(id)) {
            assert(
              stack[stack.length - 1] !== id,
              "async computation destroyed itself",
            );
            const { bundle_index, jump_index } = groups.get(id);
            groups.delete(id);
            recordAfterJump(agent, jump_index, null);
            recordEndBundle(agent, bundle_index, null);
          }
        },
        before: (id) => {
          stack.push(id);
          if (groups.has(id)) {
            const group = groups.get(id);
            const { jump_index } = group;
            group.jump_index = null;
            recordAfterJump(agent, jump_index, null);
          } else {
            groups.set(id, {
              bundle_index: recordBeginBundle(agent, null),
              jump_index: null,
            });
          }
        },
        after: (id) => {
          assert(groups.has(id), "missing async id (after)");
          assert(stack.pop() === id, "async id mismatch");
          const group = groups.get(id);
          assert(
            group.jump_index === null,
            "expected null jump index in after asynchronous hook",
          );
          group.jump_index = recordBeforeJump(agent, null);
        },
      });
      hook.enable();
      return hook;
    },
    unhook: (hook) => {
      if (hook !== null) {
        hook.disable();
      }
    },
  };
};
