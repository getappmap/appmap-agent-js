const {
  Boolean,
  String,
  Number,
  parseInt,
  Array: { isArray },
  Number: {
    isNaN,
    NaN,
    NEGATIVE_INFINITY,
    POSITIVE_INFINITY,
    MAX_SAFE_INTEGER,
    MIN_SAFE_INTEGER,
  },
  Math: { round },
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const toBoolean = Boolean;

export const toInteger = (any) => {
  if (typeof any === "boolean") {
    return Number(any);
  } else if (typeof any === "number") {
    if (any < MIN_SAFE_INTEGER) {
      return NEGATIVE_INFINITY;
    } else if (any > MAX_SAFE_INTEGER) {
      return POSITIVE_INFINITY;
    } else {
      return round(any);
    }
  } else if (typeof any === "bigint") {
    if (any < MIN_SAFE_INTEGER) {
      return NEGATIVE_INFINITY;
    } else if (any > MAX_SAFE_INTEGER) {
      return POSITIVE_INFINITY;
    } else {
      return Number(any);
    }
  } else if (typeof any === "string") {
    return parseInt(any);
  } else {
    return NaN;
  }
};

export const toNumber = (any) => {
  if (typeof any === "boolean") {
    return any ? 1 : 0;
  } else if (typeof any === "number") {
    return any;
  } else if (typeof any === "bigint") {
    return Number(any);
  } else if (typeof any === "string") {
    return Number(any);
  } else {
    return NaN;
  }
};

export const toString = (any) => {
  if (typeof any === "function") {
    return "[function]";
  } else if (isArray(any)) {
    return "[array]";
  } else if (typeof any === "object" && any !== null) {
    return "[object]";
  } else {
    return String(any);
  }
};

export const print = (any) => {
  if (typeof any === "function") {
    return "[function]";
  } else if (isArray(any)) {
    return "[array]";
  } else if (typeof any === "object" && any !== null) {
    return "[object]";
  } else if (typeof any === "string") {
    return stringifyJSON(any);
  } else {
    return String(any);
  }
};

export const jsonifyNumber = (number, replacements) => {
  if (number === NEGATIVE_INFINITY) {
    return replacements.NEGATIVE_INFINITY;
  } else if (number === POSITIVE_INFINITY) {
    return replacements.POSITIVE_INFINITY;
  } else if (isNaN(number)) {
    return replacements.NaN;
  } else {
    return number;
  }
};
