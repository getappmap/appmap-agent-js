const { URL, Error } = globalThis;

const { search: __search } = new URL(import.meta.url);

// Rearrenge the event trace into an array of trees.
// These trees are made by bookkeeping a stack:
//   - begin/after events trigger a push
//   - end/before events trigger a pop
// Missing events at the beginning or at the end of the trace are manufactured to complete the first and last tree.

const { createCounter, incrementCounter } = await import(
  `../../../util/index.mjs${__search}`
);

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

export const stackify = (events) => {
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
