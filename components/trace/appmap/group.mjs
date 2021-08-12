const { isArray } = Array;
const _Map = Map;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  // const flaten = (node) => isArray(node) ? node.flatMap(flaten) : [node];
  const flatenFast = (nodes) => {
    const output = [];
    const loop = (node) => {
      if (isArray(node)) {
        node.forEach(loop);
      } else {
        output.push(node);
      }
    };
    nodes.forEach(loop);
    return output;
  };
  return {
    orderByGroup: (marks) => {
      const root = [];
      const map = new _Map();
      for (const { type, data } of marks) {
        if (type === "group") {
          const { group, origin } = data;
          const buffer = [];
          assert(!map.has(group), "duplicate group");
          map.set(group, buffer);
          (map.has(origin) ? map.get(origin) : root).push(buffer);
        } else if (type === "event") {
          const { group } = data;
          if (!map.has(group)) {
            const buffer = [];
            map.set(group, buffer);
            root.push(buffer);
          }
          map.get(group).push(data);
        }
      }
      return flatenFast(root);
    },
  };
};
