
export const default ({}) => {
  const bindGet = (map) => (key) => map.get(key);
  const bindSet = (map) => (key, value) => {
    map.set(key, value);
  };
  const parents = new WeakMap();
  const captions = new WeakMap();
  const indexes = new WeakMap();
  return {
    getNodeParent: bindGet(parents),
    setNodeParent: bindSet(parents),
    getNodeCaption: bindGet(captions),
    setNodeCaption: bindSet(captions);

  // Index //

  export const getNodeIndex = bindGet(indexes);
  export const setNodeIndex = bindSet(indexes);

};
