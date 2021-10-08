import { createHook } from "async_hooks";

export default (dependencies) => {
  const {
    util: { assert },
    frontend: {
      incrementEventCounter,
      recordBeginBundle,
      recordEndBundle,
      recordBeforeJump,
      recordAfterJump,
    },
    emitter: { sendEmitter },
  } = dependencies;
  return {
    hookGroup: (emitter, frontend, { ordering }) => {
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
          const bundle_index = incrementEventCounter(frontend);
          const jump_index = incrementEventCounter(frontend);
          groups.set(id, { bundle_index, jump_index });
          sendEmitter(emitter, recordBeginBundle(frontend, bundle_index, null));
          sendEmitter(emitter, recordBeforeJump(frontend, jump_index, null));
        },
        destroy: (id) => {
          if (groups.has(id)) {
            assert(
              stack[stack.length - 1] !== id,
              "async computation destroyed itself",
            );
            const { bundle_index, jump_index } = groups.get(id);
            groups.delete(id);
            sendEmitter(emitter, recordAfterJump(frontend, jump_index, null));
            sendEmitter(emitter, recordEndBundle(frontend, bundle_index, null));
          }
        },
        before: (id) => {
          stack.push(id);
          if (groups.has(id)) {
            const group = groups.get(id);
            const { jump_index } = group;
            group.jump_index = null;
            sendEmitter(emitter, recordAfterJump(frontend, jump_index, null));
          } else {
            const bundle_index = incrementEventCounter(frontend);
            groups.set(id, { bundle_index, jump_index: null });
            sendEmitter(
              emitter,
              recordBeginBundle(frontend, bundle_index, null),
            );
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
          const jump_index = incrementEventCounter(frontend);
          group.jump_index = jump_index;
          sendEmitter(emitter, recordBeforeJump(frontend, jump_index, null));
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
