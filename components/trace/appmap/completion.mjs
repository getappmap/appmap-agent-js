export default (dependencies) => {
  const {
    util: { assert },
    log: { logInfo },
  } = dependencies;
  return {
    ensureCompletion: (trace) => {
      const stack = [];
      let max_index = 0;
      for (const { type, data } of trace) {
        if (type === "event") {
          const event = data;
          const { type, index, group } = event;
          if (index > max_index) {
            max_index = index;
          }
          if (stack.length > 0) {
            const { group: stack_group } = stack[stack.length - 1];
            if (group !== stack_group) {
              console.log("GRUNT", event, stack[stack.length - 1]);
            }
            assert(
              group === stack_group,
              "group mismatch within the same stack",
            );
          }
          if (type === "begin" || type === "after") {
            stack.push(event);
          } else {
            assert(type === "before" || type === "end", "invalid event type");
            assert(stack.length > 0, "missing event on the stack");
            stack.pop();
          }
        }
      }
      if (stack.length > 0) {
        logInfo(
          "manufacturting callstack completion of %j events",
          stack.length,
        );
      }
      // Because process.exit synchronously exit the process, the final stack may be incomplete.
      while (stack.length > 0) {
        const { group, time } = stack.pop();
        trace.push({
          type: "event",
          data: {
            type: "before",
            index: (max_index += 1),
            time,
            group,
            data: {
              type: "jump",
            },
          },
        });
      }
    },
  };
};
