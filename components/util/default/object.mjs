const {
  undefined,
  Object,
  Reflect: { getOwnPropertyDescriptor, ownKeys, defineProperty },
} = globalThis;

const NULL_DATA_DESCRIPTOR = {
  __proto__: null,
  value: null,
  writable: true,
  enumerable: true,
  configurable: true,
};

/* c8 ignore start */
export const hasOwnProperty =
  getOwnPropertyDescriptor(Object, "hasOwn") === undefined
    ? (object, key) => getOwnPropertyDescriptor(object, key) !== undefined
    : Object.hasOwn;
/* c8 ignore stop */

export const getOwnProperty = (object, key, _default) =>
  hasOwnProperty(object, key) ? object[key] : _default;

export const setOwnProperty = (object, key, value) => {
  if (!hasOwnProperty(object, key)) {
    defineProperty(object, key, NULL_DATA_DESCRIPTOR);
  }
  object[key] = value;
};

export const assignProperty = ({ object, key, value }) => {
  object[key] = value;
};

export const coalesce = (value, key, _default) => {
  if (
    typeof value === "function" ||
    (typeof value === "object" && value !== null)
  ) {
    return getOwnProperty(value, key, _default);
  }
  return _default;
};

export const coalesceCaseInsensitive = (value, key1, _default) => {
  if (
    typeof value === "function" ||
    (typeof value === "object" && value !== null)
  ) {
    key1 = key1.toLowerCase();
    for (const key2 of ownKeys(value)) {
      if (key2.toLowerCase() === key1) {
        return getOwnProperty(value, key2, _default);
      }
    }
  }
  return _default;
};

export const generateGet =
  (key) =>
  ({ [key]: value }) =>
    value;
