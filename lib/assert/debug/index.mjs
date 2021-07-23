import Assert from "../assert.mjs";

const _Error = Error;

export default (dependencies) => {
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
    assert: (boolean, template, ...rest) => {
      format(template, rest);
      return assert(boolean, template, ...rest);
    },
    assertSuccess: (closure, template, ...rest) => {
      format(template, [...rest, new _Error("MOCK")]);
      return assertSuccess(closure, template, ...rest);
    },
    assertSuccessAsync: (promise, template, ...rest) => {
      format(template, [...rest, new _Error("MOCK")]);
      return assertSuccessAsync(promise, template, ...rest);
    },
    assertDeadcode,
  };
};
