
const loop = (map) => {
  let key = Math.random().toString(36).slice(2);
  if (map.has(key)) {
    return loop(collection);
  }
  return key;
};

export default loop;
