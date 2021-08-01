const { isArray } = Array;
const _Map = Map;

export default (dependencies) => {
  const {
    assert: { assert },
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
    orderByGroup: (trace) => {
      const root = [];
      const map = new _Map();
      for (const { type, data } of trace) {
        if (type === "group") {
          const { index, parent } = data;
          const buffer = [];
          assert(!map.has(index), "duplicate group %j", index);
          map.set(index, buffer);
          (map.has(parent) ? map.get(parent) : root).push(buffer);
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
