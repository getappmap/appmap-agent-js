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
