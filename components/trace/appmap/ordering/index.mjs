import Group from "./group.mjs";
import Stack from "./stack.mjs";
import Jump from "./jump.mjs";

// Beware, event ordering is by far the most difficult code to understand.
// The ordering is mode in three passes:
// 1) Rearrenge the event trace into an array of trees.
//    These trees are made by bookkeeping a stack:
//    - begin/after events trigger a push
//    - end/before events trigger a pop
//    Missing events at the beginning or at the end of the trace are manufactured to complete the first and last tree.
// 2) Resolve groups.
//    Each top-level tree is associated to a group.
//    These trees are inserted into their corresponding group/ungroup event pair.
//    NB: group/ungroup event pairs appear when asynchronous ressources are registered.
// 3) Resolve jumps.
//    Insert trees starting by an after event next to their corresponding before event.
//    Event manufacturing is performed to complete sequences of events.
//    After this pass, each begin event will be matched to their end event.
//    Also, begin/end event pair can have children but not before/after event pair.

export default (dependencies) => {
  const { stackify } = Stack(dependencies);
  const { groupStack } = Group(dependencies);
  const { jumpify } = Jump(dependencies);
  return {
    orderEventArray: (events) => jumpify(groupStack(stackify(events))),
  };
};
