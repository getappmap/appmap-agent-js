export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  return {
    resolvePlaceholder: (marks) => {
      const output = [];
      const placeholders = new Map();
      for (const mark of marks) {
        if (mark.type === "event") {
          const { data: event } = mark;
          if (placeholders.has(event.index)) {
            assert(
              event.type !== "placeholder",
              "nested placeholder are not supported",
            );
            const placeholder = placeholders.get(event.index);
            placeholders.delete(event.index);
            output[placeholder.position] = {
              type: "event",
              data: {
                index: placeholder.index,
                group: placeholder.group,
                time: placeholder.time,
                type: event.type,
                data: event.data,
              },
            };
          } else if (event.type === "placeholder") {
            placeholders.set(event.data.index, {
              position: output.length,
              index: event.index,
              group: event.group,
              time: event.time,
            });
            output.push(null);
          } else {
            output.push(mark);
          }
        } else {
          output.push(mark);
        }
      }
      assert(placeholders.size === 0, "missing placeholder");
      return output;
    },
  };
};
