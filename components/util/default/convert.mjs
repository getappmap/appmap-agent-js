const {
  String,
  undefined,
  JSON: { stringify: stringifyJSON },
  Reflect: { apply },
  Object: {
    prototype: { toString: Object_prototype_toString },
  },
  Number,
  Number: { isNaN, NEGATIVE_INFINITY, POSITIVE_INFINITY, NaN },
} = globalThis;

export const toBoolean = (any) =>
  any !== null &&
  any !== undefined &&
  any !== false &&
  any !== 0 &&
  any !== 0n &&
  any !== "";

export const toNumber = (any) => {
  if (typeof any === "number") {
    return any;
  } else if (typeof any === "bigint" || typeof any === "string") {
    return Number(any);
  } else {
    return NaN;
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

const generateStringify = (stringifyString) => (any) => {
  if (
    typeof any === "boolean" ||
    typeof any === "bigint" ||
    typeof any === "number" ||
    typeof any === "symbol" ||
    any === null ||
    any === undefined
  ) {
    return String(any);
  } else if (typeof any === "string") {
    return stringifyString(any);
  } else {
    return apply(Object_prototype_toString, any, []);
  }
};

export const print = generateStringify(stringifyJSON);

const identity = (any) => any;

export const toString = generateStringify(identity);
