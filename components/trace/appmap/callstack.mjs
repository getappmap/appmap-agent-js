import Frame from "./frame.mjs";

const _Map = Map;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;

  const { createBundleFrame, createJumpFrame, isJumpFrame } =
    Frame(dependencies);

  const frameCallstack = (events) => {
    const root = createBundleFrame({
      type: "begin",
      index: 0,
      time: 0,
      group: 0,
      data: {
        type: "bundle",
      },
    });
    const stack = [];
    let current = root;
    const map = new _Map();
    for (const event of events) {
      if (event.type === "begin") {
        assert(!map.has(event.index), "duplicate frame");
        const frame = createBundleFrame(event);
        current.between.push(frame);
        map.set(event.index, frame);
        stack.push(current);
        current = frame;
      } else if (event.type === "end" || event.type === "before") {
        assert(current.begin.index === event.index, "bundle index mismatch");
        assert(current.end === null, "bundle frame has already ended");
        if (event.type === "end") {
          assert(
            event.data.type === current.begin.data.type,
            "bundle type mismatch",
          );
          current.end = event;
        } else {
          current.between.push(createJumpFrame(event));
        }
        assert(stack.length > 0, "empty stack");
        current = stack.pop();
      } else {
        assert(event.type === "after", "invalid frame");
        stack.push(current);
        current = map.get(event.index);
        assert(
          current.between.length > 0,
          "after event expected something in between",
        );
        const last = current.between[current.between.length - 1];
        assert(isJumpFrame(last), "expected a jump frame");
        assert(event.data.type === last.before.data.type, "jump type mismatch");
        assert(last.after === null, "jump has already been used");
        last.after = event;
      }
    }
    return root;
  };

  return {
    frameCallstack,
  };
};
