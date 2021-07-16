
import {assert} from "./assert.mjs";

export const bind = (closure, argument1) => {
  if (closure.length === 1) {
    return () => closure(argument1);
  }
  if (closure.length === 2) {
    return (argument2) => closure(argument1, argument2);
  }
  if (closure.length === 3) {
    return (argument2, argument3) => closure(argument1, argument2, argument3);
  }
  if (closure.length === 4) {
    return (argument2, argument3, argument4) => closure(argument1, argument2, argument3, argument4);
  }
  if (closure.length === 5) {
    return (argument2, argument3, argument4, argument5) => closure(argument1, argument2, argument3, argument4, argument5);
  }
  assert(closure.length > 0, "cannot bind a 0-arity function");
  const result = (...rest) => closure(argument1, ...rest);
  global_Reflect_defineProperty(
    result,
    "length",
    {
      __proto__: null,
      value: closure.length,
      writable: false,
      enumerable: false,
      configurable: true,
    },
  );
  return result;
};
