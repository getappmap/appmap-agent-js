import Classmap from "../classmap/index.mjs";
import Data from "./data.mjs";

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const { getClassmapClosure } = Classmap(dependencies);
  const { compileCallData, compileReturnData } = Data(dependencies);

  const isLastShallow = (stack) => {
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      const { shallow } = stack[index];
      if (shallow !== null) {
        return shallow;
      }
    }
    return false;
  };

  const compileEventTrace = (events, classmap) => {
    let counter = 0;
    const digest = [];
    const digestCallEvent = (data, options) => {
      const id = (counter += 1);
      digest.push({
        event: "call",
        thread_id: 0,
        id,
        ...compileCallData(data, options),
      });
      return id;
    };
    const digestReturnEvent = (time, data, { time: initial_time, id }) => {
      if (id !== null) {
        digest.push({
          event: "return",
          thread_id: 0,
          id: (counter += 1),
          parent_id: id,
          elapsed: (time - initial_time) / 1000,
          ...compileReturnData(data, null),
        });
      }
    };
    const stack = [];
    for (const event of events) {
      const { type, time, data } = event;
      const { type: data_type } = data;
      if (data_type !== "jump" && data_type !== "bundle") {
        if (type === "before" || type === "begin") {
          if (data_type === "apply") {
            assert(type === "begin", "invalid envent type for apply data type");
            const { function: location } = data;
            const info = getClassmapClosure(classmap, location);
            /* c8 ignore start */ if (info === null) {
              stack.push({ time, shallow: null, id: null });
            } /* c8 ignore stop */ else {
              const { shallow, ...options } = info;
              if (shallow && isLastShallow(stack)) {
                stack.push({ time, shallow: true, id: null });
              } else {
                stack.push({
                  time,
                  shallow: true,
                  id: digestCallEvent(data, options),
                });
              }
            }
          } else {
            stack.push({
              time,
              shallow: null,
              id: digestCallEvent(data, null),
            });
          }
        } else if (type === "after" || type === "end") {
          digestReturnEvent(time, data, stack.pop());
        } /* c8 ignore start */ else {
          assert(false, "invalid event type");
        } /* c8 ignore stop */
      }
    }
    return digest;
  };

  return { compileEventTrace };
};
