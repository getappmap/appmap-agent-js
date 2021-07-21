
const _Map = Map;

export const createMemo = (computeAsync) => {
  map: new _Map(),
  computeAsync,
};

export const getMemoAsync = async ({map, computeAsync}, key) => {
  if (map.has(key)) {
    return map.get(key)
  }
  const value = await computeAsync(key);
  map.set(key, value);
  return value;
};
