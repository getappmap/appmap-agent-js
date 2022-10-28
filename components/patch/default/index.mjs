const {
  Reflect: { getPrototypeOf, defineProperty, getOwnPropertyDescriptor },
  undefined,
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logErrorWhen } = await import(`../../log/index.mjs${__search}`);
const { assert, hasOwnProperty } = await import(
  `../../util/index.mjs${__search}`
);

export const patch = (object, key, makePatch) => {
  if (hasOwnProperty(object, key)) {
    const descriptor = getOwnPropertyDescriptor(object, key);
    assert(
      !logErrorWhen(
        !hasOwnProperty(descriptor, "value"),
        "Cannot monkey-patch accessor property %j of object %o",
        key,
        object,
      ),
      "Cannot monkey-patch accessor property",
      ExternalAppmapError,
    );
    assert(
      !logErrorWhen(
        !descriptor.configurable && !descriptor.writable,
        "Cannot monkey-patch constant data property %j of object %o",
        key,
        object,
      ),
      "Cannot monkey-patch constant data property",
      ExternalAppmapError,
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
        assert(
          !logErrorWhen(
            !hasOwnProperty(descriptor, "value"),
            "Cannot monkey-patch accessor property %j of prototype %o",
            key,
            prototype,
          ),
          "Cannot monkey-patch accessor property on prototype",
          ExternalAppmapError,
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
