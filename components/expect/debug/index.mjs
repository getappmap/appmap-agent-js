const _Error = Error;

export default (dependencies) => {
  const {
    util: { format },
    "expect-inner": {
      expect,
      expectSuccess,
      expectSuccessAsync,
      expectDeadcode,
    },
  } = dependencies;
  return {
    expect: (boolean, template, ...rest) => {
      format(template, rest);
      return expect(boolean, template, ...rest);
    },
    expectSuccess: (closure, template, ...rest) => {
      format(template, [...rest, new _Error("DUMMY")]);
      return expectSuccess(closure, template, ...rest);
    },
    expectSuccessAsync: (promise, template, ...rest) => {
      format(template, [...rest, new _Error("DUMMY")]);
      return expectSuccessAsync(promise, template, ...rest);
    },
    expectDeadcode,
  };
};
