const {
  Reflect: { getPrototypeOf, defineProperty, getOwnPropertyDescriptor },
  undefined,
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { expect } = await import(`../../expect/index.mjs${__search}`);
const { hasOwnProperty } = await import(`../../util/index.mjs${__search}`);

export const patch = (object, key, makePatch) => {
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
      value: makePatch(descriptor.value),
    });
  } else {
    let prototype = getPrototypeOf(object);
    let existing_value = undefined;
    while (prototype !== null) {
      if (hasOwnProperty(prototype, key)) {
        const descriptor = getOwnPropertyDescriptor(prototype, key);
        expect(
          hasOwnProperty(descriptor, "value"),
          "cannot monkey-patch accessor property %j of prototype %o",
          key,
          prototype,
        );
        existing_value = descriptor.value;
        prototype = null;
      } else {
        prototype = getPrototypeOf(prototype);
      }
    }
    defineProperty(object, key, {
      __proto__: null,
      writable: true,
      enumerable: false,
      value: makePatch(existing_value),
      configurable: true,
    });
  }
};
