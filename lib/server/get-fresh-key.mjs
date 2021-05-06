export const getFreshKey = (collection) => {
  const key = Math.random().toString(36).slice(2);
  if (collection.has(key)) {
    return getFreshKey(collection);
  }
  return key;
};
