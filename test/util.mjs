export const {
  String,
  Array: { isArray },
  Reflect: { ownKeys, getOwnPropertyDescriptor },
  JSON: { stringify: stringifyJSON },
  undefined,
  Object: {
    hasOwn = (object, key) =>
      getOwnPropertyDescriptor(object, key) !== undefined,
  },
} = globalThis;

export const matchJSON = (json1, json2, path) => {
  if (isArray(json1)) {
    if (!isArray(json2)) {
      return `not an array at ${path}`;
    } else if (json1.length > json2.length) {
      return `too few items at ${path}`;
    } else {
      const { length } = json1;
      for (let index = 0; index < length; index += 1) {
        const maybe_mismatch = matchJSON(
          json1[index],
          json2[index],
          `${path}[${String(index)}]`,
        );
        if (maybe_mismatch !== null) {
          return maybe_mismatch;
        }
      }
      return null;
    }
  } else if (typeof json1 === "object" && json1 !== null) {
    if (typeof json2 !== "object" || json2 === null) {
      return `not an object at ${path}`;
    } else {
      const keys = ownKeys(json1);
      for (const key of keys) {
        if (hasOwn(json2, key)) {
          const maybe_mismatch = matchJSON(
            json1[key],
            json2[key],
            /^[a-zA-Z_$][a-zA-Z0-9_$]*$/u.test(key)
              ? `${path}.${key}`
              : `${path}[${stringifyJSON(key)}]`,
          );
          if (maybe_mismatch !== null) {
            return maybe_mismatch;
          }
        } else {
          return `missing key ${stringifyJSON(key)} at ${path}`;
        }
      }
      return null;
    }
  } else {
    return json1 === json2 ? null : `primitive mismatch at ${path}`;
  }
};
