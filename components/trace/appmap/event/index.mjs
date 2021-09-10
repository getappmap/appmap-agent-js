import Classmap from "../classmap.mjs";
import Data from "./data.mjs";

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const { getClassmapClosure } = Classmap(dependencies);
  const { compileCallData, compileReturnData } = Data(dependencies);

  const compileEventTrace = (events, slice, classmap) => {
    const stack = [];
    const digest = [];
    const isLastShallow = (stack) => {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        const { shallow } = stack[index];
        if (shallow !== null) {
          return shallow;
        }
      }
      return false;
    };
    for (const event of events) {
      const { type, time, index, data } = event;
      const { type: data_type } = data;
      if (slice.has(index) && data_type !== "bundle" && data_type !== "jump") {
        if (type === "begin" || type === "before") {
          let shallow = null;
          let skip = false;
          if (data_type === "apply") {
            const { function: route } = data;
            ({
              file: { shallow },
            } = getClassmapClosure(classmap, route));
            skip = shallow && isLastShallow(stack);
          }
          stack.push({ time, shallow, skip });
          if (!skip) {
            digest.push({
              event: "call",
              thread_id: 0,
              id: 2 * index,
              ...compileCallData(data, classmap),
            });
          }
        } else {
          assert(type === "after" || type === "end", "invalid event type");
          const { time: initial_time, skip } = stack.pop();
          if (!skip) {
            digest.push({
              event: "return",
              thread_id: 0,
              id: 2 * index + 1,
              parent_id: 2 * index,
              elapsed: time - initial_time,
              ...compileReturnData(data, classmap),
            });
          }
        }
      }
    }
    return digest;
  };

  return { compileEventTrace };
};
