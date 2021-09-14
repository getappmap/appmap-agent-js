const _Map = Map;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;

  const completions = new _Map([
    // bundle //
    [
      "bundle",
      {
        type: "bundle",
      },
    ],
    [
      "apply",
      {
        type: "apply",
        error: null,
        result: {
          type: "string",
          print: "MANUFACTURED APPMAP RETURN VALUE",
        },
      },
    ],
    [
      "response",
      {
        type: "response",
        status: 200,
        message: "MANUFACTURED-APPMAP-RESPONSE",
        headers: {},
      },
    ],
    // jump //
    [
      "jump",
      {
        type: "jump",
      },
    ],
    [
      "query",
      {
        type: "query",
        error: { type: "null", print: "null" },
      },
    ],
    [
      "request",
      {
        type: "request",
        status: 200,
        message: "MANUFACTURED-APPMAP-RESPONSE",
        headers: {},
      },
    ],
  ]);

  const extractJump = (events) => {
    const jumps = new Map();
    const iterator = events[Symbol.iterator]();
    const collectStack = (event) => {
      const stack = [event];
      let depth = 1;
      while (depth > 0) {
        const { value: event, done } = iterator.next();
        assert(!done, "incomplete stack");
        const { type } = event;
        if (type === "after") {
          const jump = collectStack(event);
          const { index } = event;
          assert(!jumps.has(index), "duplicate jump");
          jumps.set(index, jump);
        } else {
          stack.push(event);
          depth += type === "begin" ? 1 : -1;
        }
      }
      return stack;
    };
    const skeleton = [];
    {
      while (
        /* eslint-disable no-constant-condition */ true /* eslint-enable no-constant-condition */
      ) {
        const { value: event, done } = iterator.next();
        if (done) {
          break;
        }
        const stack = collectStack(event);
        const { type, index } = event;
        if (type === "after") {
          jumps.set(index, stack);
        } else {
          skeleton.push(...stack);
        }
      }
    }
    return { skeleton, jumps };
  };

  const makeCompletion = (
    type,
    { index, time, data: { type: data_type } },
  ) => ({
    type,
    index,
    group: 0,
    time,
    data: completions.get(data_type),
  });

  const inlineJump = (skeleton, jumps) => {
    const result = [];
    const stack = [];
    const loop = (event) => {
      result.push(event);
      const { type, index } = event;
      if (type === "begin") {
        stack.push(event);
      } else if (type === "end") {
        assert(stack.length > 0, "cannot pop event from empty stack");
        const { index: begin_index } = stack.pop();
        assert(index === begin_index, "begin/end index mismatch");
      }
      if (type === "before") {
        if (jumps.has(index)) {
          const events = jumps.get(index);
          assert(events !== null, "jump has already been used");
          jumps.set(index, null);
          events.forEach(loop);
        } else {
          result.push(makeCompletion("after", event));
          assert(stack.length > 0, "empty stack in presence of before event");
          result.push(makeCompletion("end", stack.pop()));
        }
      }
    };
    skeleton.forEach(loop);
    return result;
  };

  return {
    orderByStack: (events) => {
      const { skeleton, jumps } = extractJump(events);
      return inlineJump(skeleton, jumps);
    },
  };
};
