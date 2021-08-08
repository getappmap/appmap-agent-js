const _String = String;
const _undefined = undefined;
const { stringify } = JSON;
const { apply } = Reflect;
const { prototype } = Object;
const { toString } = prototype;

export const print = (any) => {
  if (typeof any === "string") {
    return stringify(any);
  }
  if (
    typeof any === "boolean" ||
    typeof any === "bigint" ||
    typeof any === "number" ||
    typeof any === "symbol" ||
    any === null ||
    any === _undefined
  ) {
    return _String(any);
  }
  return apply(toString, any, []);
};
