
import Assert from "../index.mjs";

export default (dependencies) = {
  const {
    print,
    format,
    assert,
    assertSuccess,
    assertSuccessAsync,
    assertDeadcode,
  } = Assert(dependencies);
  return {
    print,
    format,
    assert: (boolean, template, ...values) => {
      format(template, values);
      return assert(boolean, template, values);
    },
    assertSuccess: (closure, template, ... rest) => {
      format(template, [...rest, new _Error("MOCK")]);
      return assertSuccess(closure, template, ... rest);
    },
    assertSuccessAsync: (promise, template, ... rest) => {
      format(template, [...rest, new _Error("MOCK")]);
      return assertSuccessAsync(closure, template, ... rest);
    }
    assertDeadcode,
  };
};
