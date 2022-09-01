export default (dependencies) => {
  const {
    util: { createCounter, incrementCounter },
  } = dependencies;

  const makeFrame = (enter, children, leave) => ({ enter, children, leave });

  const getCurrentFrameArray = (frames, stack) =>
    stack.length === 0 ? frames : stack[stack.length - 1].children;

  const createJumpEvent = (site, tab, group, time) => ({
    type: "event",
    site,
    tab,
    group,
    time,
    payload: {
      type: "jump",
    },
  });

  const stackify = (events) => {
    let root = [];
    const stack = [];
    let max = 0;
    for (const event of events) {
      if (event.tab > max) {
        max = event.tab;
      }
    }
    const counter = createCounter(max);
    for (const event of events) {
      if (event.site === "begin" || event.site === "after") {
        stack.push(makeFrame(event, [], null));
      } else if (event.site === "end" || event.site === "before") {
        if (stack.length > 0) {
          const frame = stack.pop();
          frame.leave = event;
          getCurrentFrameArray(root, stack).push(frame);
        } else {
          root = [
            makeFrame(
              createJumpEvent(
                "after",
                incrementCounter(counter),
                event.group,
                event.time,
              ),
              root,
              event,
            ),
          ];
        }
      } /* c8 ignore start */ else {
        throw new Error("invalid event site");
      } /* c8 ignore stop */
    }
    while (stack.length > 0) {
      const frame = stack.pop();
      frame.leave = createJumpEvent(
        "before",
        incrementCounter(counter),
        frame.enter.group,
        frame.enter.time,
      );
      getCurrentFrameArray(root, stack).push(frame);
    }
    return root;
  };

  return { stackify };
};
