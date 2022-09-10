const {
  Reflect: {apply},
  String,
  undefined,
  Object: {prototype: {toString: toStringBuiltin}},
  Math: {round},
  Number: {parseInt, isNaN},
} = globalThis;

export const toInteger = (any) => {
  if (typeof any === "string") {
    const number = parseInt(any);
    return isNaN(number) ? -1 : number;
  } else if (typeof any === "number") {
    return round(any);
  } else {
    return -1;
  }
};

export const toString = (any) => {
  if (typeof any === "string") {
    return any;
  } else if (
    typeof any === "boolean" ||
    typeof any === "bigint" ||
    typeof any === "number" ||
    typeof any === "symbol" ||
    any === null ||
    any === undefined
  ) {
    return String(any);
  } else {
    return apply(toStringBuiltin, any, []);
  }
};
