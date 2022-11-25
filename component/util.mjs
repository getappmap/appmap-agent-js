export const {
  undefined,
  Reflect: { getOwnPropertyDescriptor },
  Object: {
    hasOwn = (obj, key) => getOwnPropertyDescriptor(obj, key) !== undefined,
  },
} = globalThis;
