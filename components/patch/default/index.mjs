const { getPrototypeOf, defineProperty, getOwnPropertyDescriptor } = Reflect;

const _undefined = undefined;

export default (dependencies) => {
  const {
    expect: { expect },
    util: { hasOwnProperty },
  } = dependencies;
  return {
    patch: (object, key, value) => {
      if (hasOwnProperty(object, key)) {
        const descriptor = getOwnPropertyDescriptor(object, key);
        expect(
          hasOwnProperty(descriptor, "value"),
          "cannot monkey-patch accessor property %j of object %o",
          key,
          object,
        );
        expect(
          descriptor.configurable || descriptor.writable,
          "cannot monkey-patch constant data property %j of object %o",
          key,
          object,
        );
        defineProperty(object, key, {
          __proto__: descriptor,
          value,
        });
        return descriptor.value;
      } else {
        defineProperty(object, key, {
          __proto__: null,
          writable: true,
          enumerable: false,
          value,
          configurable: true,
        });
        object = getPrototypeOf(object);
        while (object !== null) {
          if (hasOwnProperty(object, key)) {
            const descriptor = getOwnPropertyDescriptor(object, key);
            expect(
              hasOwnProperty(descriptor, "value"),
              "cannot monkey-patch accessor property %j of prototype %o",
              key,
              object,
            );
            return descriptor.value;
          }
          object = getPrototypeOf(object);
        }
        return _undefined;
      }
    },
  };
};
