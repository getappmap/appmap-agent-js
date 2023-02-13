// Resolve groups.
// Each top-level tree is associated to a group.
// These trees are inserted into their corresponding group/ungroup event pair.
// NB: group/ungroup event pairs appear when asynchronous ressources are registered.

const {
  Array: { from: toArray },
  Map,
} = globalThis;

const takeMap = (map, key) => {
  const value = map.get(key);
  map.delete(key);
  return value;
};

export const groupStack = (root) => {
  const deep_group_map = new Map();
  const root_group_map = new Map();
  for (const node of root) {
    const {
      enter: { group },
    } = node;
    if (root_group_map.has(group)) {
      root_group_map.get(group).push(node);
    } else {
      root_group_map.set(group, [node]);
    }
  }
  const mapping = ({ enter, children, leave }) => {
    children = children.map(mapping);
    if (enter.site === "begin" && enter.payload.type === "group") {
      const {
        payload: { group },
      } = enter;
      if (root_group_map.has(group)) {
        for (const async_child of takeMap(root_group_map, group)) {
          children.push(mapping(async_child));
        }
      } else if (deep_group_map.has(group)) {
        for (const async_child of takeMap(deep_group_map, group)) {
          children.push(async_child);
        }
      }
    }
    return { enter, children, leave };
  };
  for (const group of root_group_map.keys()) {
    deep_group_map.set(group, takeMap(root_group_map, group).map(mapping));
  }
  return toArray(deep_group_map.values()).flat(1);
};
