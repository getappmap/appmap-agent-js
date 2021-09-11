const { MAX_SAFE_INTEGER } = Number;

export default (dependencies) => {
  const {
    util: { assert },
    log: { logInfo },
  } = dependencies;
  return {
    ensureCompletion: (trace) => {
      const stack = [];
      let stack_group = null;
      for (const { type, data } of trace) {
        if (type === "event") {
          const event = data;
          const { type, group } = event;
          // For await jumps, the after event is unfortunately not in the correct group.
          assert(
            type === "after" || group !== null,
            "only after event can be groupless",
          );
          if (type === "begin" || type === "after") {
            assert(
              group === null || stack_group === null || stack_group === group,
              "group mismatch for being/after event",
            );
            if (stack_group === null) {
              stack_group = group;
            }
            stack.push(event);
          } else {
            assert(type === "before" || type === "end", "invalid event type");
            assert(
              stack_group === null || group === stack_group,
              "group mismatch for before/end event",
            );
            assert(stack.length > 0, "missing event on the stack");
            const other_event = stack.pop();
            const { group: other_group } = other_event;
            if (other_group === null) {
              other_event.group = group;
            }
            if (stack.length === 0) {
              stack_group = null;
            }
          }
        }
      }
      // Because process.exit synchronously exit the process, the final stack may be incomplete.
      if (stack.length > 0) {
        logInfo(
          "manufacturing callstack completion of %j events",
          stack.length,
        );
      }
      let index = MAX_SAFE_INTEGER;
      while (stack.length > 0) {
        const event = stack.pop();
        event.time = 0;
        if (event.group === null) {
          event.group = MAX_SAFE_INTEGER;
        }
        trace.push({
          type: "event",
          data: {
            type: "before",
            index: (index -= 1),
            time: 0,
            group: event.group,
            data: {
              type: "jump",
            },
          },
        });
      }
    },
  };
};
