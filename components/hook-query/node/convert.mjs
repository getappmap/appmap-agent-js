const {
  Set,
  Map,
  Array: { isArray, from: toArray },
  Object: toObject,
  Object: { entries: toEntryArray, fromEntries: fromEntryArray },
} = globalThis;

const isStringEntry = ([key]) => typeof key === "string";

export const toParameterCollection = (parameters) => {
  if (parameters instanceof Set) {
    return toArray(parameters.values());
  } else if (parameters instanceof Map) {
    return fromEntryArray(toArray(parameters.entries()).filter(isStringEntry));
  } else if (isArray(parameters)) {
    return toArray(parameters);
  } else {
    return fromEntryArray(toEntryArray(toObject(parameters)));
  }
};
