<<<<<<< HEAD
=======
import Expect from "../expect.mjs";

>>>>>>> dccffdd00efd62624d438940f4333fbe0c7bedc0
const _Error = Error;

export default (dependencies) => {
  const {
    util: { format },
<<<<<<< HEAD
    "expect-inner": {
      expect,
      expectSuccess,
      expectSuccessAsync,
      expectDeadcode,
    },
  } = dependencies;
=======
  } = dependencies;
  const { expect, expectSuccess, expectSuccessAsync, expectDeadcode } =
    Expect(dependencies);
>>>>>>> dccffdd00efd62624d438940f4333fbe0c7bedc0
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
