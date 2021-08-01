const { getOwnPropertyDescriptor, ownKeys } = Reflect;
const _undefined = undefined;

export default (dependencies) => {
  const hasOwnProperty = (object, key) =>
    getOwnPropertyDescriptor(object, key) !== _undefined;
  const getOwnPropertyValue = (object, key, _default) => {
    const descriptor = getOwnPropertyDescriptor(object, key);
    if (descriptor === _undefined || !hasOwnProperty(descriptor, "value")) {
      return _default;
    }
    return descriptor.value;
  };
  return {
    hasOwnProperty,
    getOwnPropertyValue,
    coalesce: (value, key, _default) => {
      if (
        typeof value === "function" ||
        (typeof value === "object" && value !== null)
      ) {
        return getOwnPropertyValue(value, key, _default);
      }
      return _default;
    },
    coalesceCaseInsensitive: (value, key1, _default) => {
      if (
        typeof value === "function" ||
        (typeof value === "object" && value !== null)
      ) {
        key1 = key1.toLowerCase();
        for (const key2 of ownKeys(value)) {
          if (key2.toLowerCase() === key1) {
            return getOwnPropertyValue(value, key2, _default);
          }
        }
      }
      return _default;
    },
    mapMaybe: (maybe, transform) => (maybe === null ? null : transform(maybe)),
  };
};
