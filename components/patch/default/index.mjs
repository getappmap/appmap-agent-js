const _undefined = undefined;
const { getPrototypeOf, defineProperty, getOwnPropertyDescriptor } = Reflect;
export default (dependencies) => {
  const {
    expect: { expect },
    util: { hasOwnProperty },
  } = dependencies;
  return {
    patch: (object, key, value) => {
      expect(
        !hasOwnProperty(object, key),
        "cannot patch object because it has %j as own property",
        key,
      );
      let descriptor = _undefined;
      for (
        let prototype = object;
        prototype !== null && descriptor === _undefined;
        prototype = getPrototypeOf(prototype)
      ) {
        descriptor = getOwnPropertyDescriptor(prototype, key);
      }
      expect(
        descriptor !== _undefined,
        "cannot patch object because %j is not present in it prototype chain",
        key,
      );
      expect(
        hasOwnProperty(descriptor, "value"),
        "cannot path object because %j is an accessor property",
        key,
      );
      defineProperty(object, key, {
        __proto__: null,
        writable: false,
        enumerable: false,
        value,
        configurable: true,
      });
      return descriptor.value;
    },
  };
};
