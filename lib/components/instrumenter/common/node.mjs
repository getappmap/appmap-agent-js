const bindGet = (map) => (key) => map.get(key);

const bindSet = (map) => (key, value) => {
  map.set(key, value);
};

// Parent //
const parents = new WeakMap();
export const getNodeParent = bindGet(parents);
export const setNodeParent = bindSet(parents);

// Caption //
const captions = new WeakMap();
export const getNodeCaption = bindGet(captions);
export const setNodeCaption = bindSet(captions);

// Index //
const indexes = new WeakMap();
export const getNodeIndex = bindGet(indexes);
export const setNodeIndex = bindSet(indexes);
