// Rearrenge the event trace into an array of trees.
// These trees are made by bookkeeping a stack:
//   - begin/after events trigger a push
//   - end/before events trigger a pop
// Missing events at the beginning or at the end of the trace are manufactured to complete the first and last tree.

import { InternalAppmapError } from "../../../error/index.mjs";
import { createCounter, incrementCounter } from "../../../util/index.mjs";

const makeFrame = (enter, children, leave) => ({ enter, children, leave });

const getCurrentFrameArray = (frames, stack) =>
  stack.length === 0 ? frames : stack[stack.length - 1].children;

const createJumpEvent = (session, site, tab, group, time) => ({
  type: "event",
  session,
  site,
  tab,
  group,
  time,
  payload: {
    type: "jump",
  },
});

const createFreshCounter = (events) => {
  let max = 0;
  for (const event of events) {
    if (event.tab > max) {
      max = event.tab;
    }
  }
  return createCounter(max);
};

export const stackify = (events) => {
  let root = [];
  const stack = [];
  const counter = createFreshCounter(events);
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
              event.session,
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
      throw new InternalAppmapError("invalid event site");
    } /* c8 ignore stop */
  }
  while (stack.length > 0) {
    const frame = stack.pop();
    frame.leave = createJumpEvent(
      frame.enter.session,
      "before",
      incrementCounter(counter),
      frame.enter.group,
      frame.enter.time,
    );
    getCurrentFrameArray(root, stack).push(frame);
  }
  return root;
};
