const parents = new WeakMap();

export const getParent = (node) => {
  return parents.get(node);
};

export const setParent = (node, parent) => {
  parents.set(node, parent);
};
