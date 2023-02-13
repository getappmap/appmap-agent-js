// Rearrenge the event trace into an array of trees.
// These trees are made by bookkeeping a stack:
//   - begin/after events trigger a push
//   - end/before events trigger a pop
// Missing events at the beginning or at the end of the trace are manufactured to complete the first and last tree.

import { InternalAppmapError } from "../../../error/index.mjs";
import { createCounter, incrementCounter } from "../../../util/index.mjs";

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
  const stack = [
    {
      enter: null,
      children: [],
      leave: null,
    },
  ];
  const counter = createFreshCounter(events);
  for (const event of events) {
    if (event.site === "begin" || event.site === "after") {
      stack.push({
        enter: event,
        children: [],
        leave: null,
      });
    } else if (event.site === "end" || event.site === "before") {
      if (stack.length > 1) {
        const frame = stack.pop();
        frame.leave = event;
        stack[stack.length - 1].children.push(frame);
      } else {
        stack[0].children = [
          {
            enter: createJumpEvent(
              event.session,
              "after",
              incrementCounter(counter),
              event.group,
              event.time,
            ),
            children: stack[0].children,
            leave: event,
          },
        ];
      }
    } /* c8 ignore start */ else {
      throw new InternalAppmapError("invalid event site");
    } /* c8 ignore stop */
  }
  while (stack.length > 1) {
    const frame = stack.pop();
    frame.leave = createJumpEvent(
      frame.enter.session,
      "before",
      incrementCounter(counter),
      frame.enter.group,
      frame.enter.time,
    );
    stack[stack.length - 1].children.push(frame);
  }
  return stack[0].children;
};
