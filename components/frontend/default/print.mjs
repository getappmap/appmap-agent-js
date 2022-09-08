const { apply } = Reflect;
const _String = String;
const _undefined = undefined;
const {
  prototype: { toString },
} = Object;

const { round } = Math;
const { parseInt, isNaN } = Number;

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
