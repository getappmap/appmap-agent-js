
import Format from "./format.mjs";

export default (dependencies) = {
  const {
    violation:{
    throwViolation,
    throwViolationAsync,
  }} = dependencies;
  {format} = Format(dependencies);
  return {
    print,
    format,
    assert: (boolean, template, ...rest) => {
      if (!boolean) {
        throwViolation(format(template, rest));
      }
    },
    assertSuccess: (closure, template, ...rest) => {
      try {
        return closure();
      } catch (error) {
        throwViolation(format(template, [...rest, error]));
      }
    },
    assertSuccessAsync: async (promise, template, ...rest) => {
      try {
        return await promise;
      } catch (error) {
        return throwViolationAsync(format(template, [...rest, error]));
      }
    },
    assertDeadcode: (template, ...rest1) => (...rest2) => {
      throwViolation(format(template, [...rest1, ...rest2]));
    },
  };
};
