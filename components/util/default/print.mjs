
const {
  String,
  undefined,
  JSON: {stringify:stringifyJSON},
  Reflect: {apply},
  Object: {prototype:{toString}},
} = globalThis;

export const print = (any) => {
  if (typeof any === "string") {
    return stringifyJSON(any);
  }
  if (
    typeof any === "boolean" ||
    typeof any === "bigint" ||
    typeof any === "number" ||
    typeof any === "symbol" ||
    any === null ||
    any === undefined
  ) {
    return String(any);
  }
  return apply(toString, any, []);
};
