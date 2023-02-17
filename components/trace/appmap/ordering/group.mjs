// Resolve groups.
// Each top-level tree is associated to a group.
// These trees are inserted into their corresponding group/ungroup event pair.
// NB: group/ungroup event pairs appear when asynchronous ressources are registered.

const {
  Array: { from: toArray },
  Map,
  String,
} = globalThis;

const takeMap = (map, key) => {
  const value = map.get(key);
  map.delete(key);
  return value;
};

const makeGroupKey = (session, group) => `${session}/${String(group)}`;

export const groupStack = (root) => {
  const deep_group_map = new Map();
  const root_group_map = new Map();
  for (const node of root) {
    const key = makeGroupKey(node.enter.session, node.enter.group);
    if (root_group_map.has(key)) {
      root_group_map.get(key).push(node);
    } else {
      root_group_map.set(key, [node]);
    }
  }
  const mapping = ({ enter, children, leave }) => {
    children = children.map(mapping);
    if (enter.site === "begin" && enter.payload.type === "group") {
      // NB: We want to use `enter.payload.group` and not `enter.group`.
      // - `enter.payload.group` is the id of the newly created async group.
      // - `enter.group` is the id of the current async group.
      const key = makeGroupKey(enter.session, enter.payload.group);
      if (root_group_map.has(key)) {
        for (const async_child of takeMap(root_group_map, key)) {
          children.push(mapping(async_child));
        }
      } else if (deep_group_map.has(key)) {
        for (const async_child of takeMap(deep_group_map, key)) {
          children.push(async_child);
        }
      }
    }
    return { enter, children, leave };
  };
  for (const key of root_group_map.keys()) {
    deep_group_map.set(key, takeMap(root_group_map, key).map(mapping));
  }
  return toArray(deep_group_map.values()).flat(1);
};
