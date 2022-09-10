// Beware, event ordering is by far the most difficult code to understand.
// The ordering is mode in three passes:
// 1) Rearrenge the event trace into an array of trees which each represent a top-level callstack.
// 2) Resolve groups by inserting top-level trees where the asynchronous resource was registered.
// 3) Resolve jumps by moving the tree framed by after events next to their corresponding before event.

import Group from "./group.mjs";
import Stack from "./stack.mjs";
import Jump from "./jump.mjs";

export default (dependencies) => {
  const { stackify } = Stack(dependencies);
  const { groupStack } = Group(dependencies);
  const { jumpify } = Jump(dependencies);
  return {
    orderEventArray: (events) => jumpify(groupStack(stackify(events))),
  };
};
