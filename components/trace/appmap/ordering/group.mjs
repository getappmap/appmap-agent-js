const { from: toArray } = Array;

export default (dependencies) => {
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

  const takeMap = (map, key) => {
    const value = map.get(key);
    map.delete(key);
    return value;
  };

  const groupStack = (root) => {
    const groups2 = new Map();
    const groups1 = new Map();
    for (const node of root) {
      const {
        enter: { group },
      } = node;
      if (groups1.has(group)) {
        groups1.get(group).push(node);
      } else {
        groups1.set(group, [node]);
      }
    }
    const mapping = ({ enter, children, leave }) => {
      children = children.map(mapping);
      if (enter.site === "begin" && enter.payload.type === "group") {
        const {
          payload: { group },
        } = enter;
        if (groups1.has(group)) {
          for (const async_child of takeMap(groups1, group)) {
            children.push(mapping(async_child));
          }
        } else if (groups2.has(group)) {
          for (const async_child of takeMap(groups2, group)) {
            children.push(async_child);
          }
        }
      }
      return makeFrame(enter, children, leave);
    };
    for (const group of groups1.keys()) {
      groups2.set(group, takeMap(groups1, group).map(mapping));
    }
    return toArray(groups2.values()).flat(1);
  };

  return { groupStack };
};
