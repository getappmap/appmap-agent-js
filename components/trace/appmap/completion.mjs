const { MAX_SAFE_INTEGER } = Number;

export default (dependencies) => {
  const {
    util: { assert },
    log: { logInfo },
  } = dependencies;
  return {
    ensureCompletion: (trace) => {
      const stack = [];
      for (const { type, data } of trace) {
        if (type === "event") {
          const event = data;
          const { type, group, index } = event;
          assert(
            stack.length === 0 || stack[0].group === group,
            "group mismatch within the same stack",
          );
          if (type === "begin" || type === "after") {
            stack.push(event);
          } else {
            assert(type === "before" || type === "end", "invalid event type");
            const { type: other_type, index: other_index } = stack.pop();
            assert(
              other_type !== "begin" || type !== "end" || index === other_index,
              "begin/end index mismatch",
            );
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
