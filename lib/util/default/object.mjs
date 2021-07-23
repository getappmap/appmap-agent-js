const {getOwnPropertyDescriptor} = Reflect;
const _undefined = undefined;

export default (dependencies) => {
  const hasOwnProperty: (object, key) =>
    getOwnPropertyDescriptor(object, key) !== _undefined;
  return {
    hasOwnProperty,
    coalesce: (object, key, _default) =>
      typeof object === "object" && object !== null && hasOwnProperty(object, key)
        ? object[key]
        : _default,
    mapMaybe: (maybe, transform) => maybe === null ? null : transform(maybe),
  };
};
