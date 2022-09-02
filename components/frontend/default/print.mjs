const { apply } = Reflect;
const _String = String;
const _undefined = undefined;
const {
  prototype: { toString },
} = Object;

export const print = (any) => {
  if (typeof any === "string") {
    return any;
  } else if (
    typeof any === "boolean" ||
    typeof any === "bigint" ||
    typeof any === "number" ||
    typeof any === "symbol" ||
    any === null ||
    any === _undefined
  ) {
    return _String(any);
  } else {
    return apply(toString, any, []);
  }
};
