import Classmap from "../classmap.mjs";
import Data from "./data.mjs";

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const { getClassmapClosure } = Classmap(dependencies);
  const { compileCallData, compileReturnData } = Data(dependencies);

  const compileEventTrace = (events, classmap) => {
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
    let counter = 0;
    for (const event of events) {
      const { type, time, data } = event;
      const { type: data_type } = data;
      if (data_type !== "bundle" && data_type !== "jump") {
        if (type === "begin" || type === "before") {
          let shallow = null;
          let skip = false;
          if (data_type === "apply") {
            const { function: route } = data;
            ({ shallow } = getClassmapClosure(classmap, route));
            skip = shallow && isLastShallow(stack);
          }
          let id = null;
          if (!skip) {
            id = counter += 1;
            digest.push({
              event: "call",
              thread_id: 0,
              id,
              ...compileCallData(data, classmap),
            });
          }
          stack.push({ time, shallow, id });
        } else {
          assert(type === "after" || type === "end", "invalid event type");
          const { time: initial_time, id } = stack.pop();
          if (id !== null) {
            digest.push({
              event: "return",
              thread_id: 0,
              id: (counter += 1),
              parent_id: id,
              elapsed: (time - initial_time) / 1000,
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
