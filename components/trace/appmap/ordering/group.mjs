const { from: toArray } = Array;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;

  // const manufactureEnterGroupEvent = (group) => ({
  //   type: "event",
  //   site: "begin",
  //   tab: 0,
  //   group: 0,
  //   time: 0,
  //   payload: {
  //     type: "group",
  //     group,
  //     description: "MISSING",
  //   },
  // });
  //
  // const manufactureLeaveGroupEvent = (group) => ({
  //   type: "event",
  //   site: "end",
  //   tab: 0,
  //   group: 0,
  //   time: 0,
  //   payload: {
  //     type: "ungroup",
  //   },
  // });

  const makeFrame = (enter, children, leave) => ({ enter, children, leave });

  const groupStack = (root) => {
    const groups = new Map();
    for (const node of root) {
      const {
        enter: { group },
      } = node;
      if (groups.has(group)) {
        groups.get(group).push(node);
      } else {
        groups.set(group, [node]);
      }
    }
    const mapping = ({ enter, children, leave }) => {
      if (enter.site === "begin" && enter.payload.type === "group") {
        const {
          payload: { group },
        } = enter;
        if (groups.has(group)) {
          assert(children.length === 0, "unexpected group children");
          children = groups.get(group);
          assert(children !== null, "unexpected group self-initialization");
          groups.delete(group);
        }
      }
      return makeFrame(enter, children.map(mapping), leave);
    };
    for (const group of groups.keys()) {
      const frames = groups.get(group);
      groups.set(group, null);
      groups.set(group, frames.map(mapping));
    }
    return toArray(groups.values()).flat(1);
  };

  return { groupStack };
};
