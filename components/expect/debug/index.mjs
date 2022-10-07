const { Error, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { format } = await import(`../../util/index.mjs${__search}`);
const {
  expect: expectInner,
  expectSuccess: expectInnerSuccess,
  expectSuccessAsync: expectInnerSuccessAsync,
} = await import(`../../expect-inner/index.mjs${__search}`);

export const { expectDeadcode, expectDeadcodeAsync } = await import(
  `../../expect-inner/index.mjs${__search}`
);

export const expect = (boolean, template, ...rest) => {
  format(template, rest);
  return expectInner(boolean, template, ...rest);
};

export const expectSuccess = (closure, template, ...rest) => {
  format(template, [...rest, new Error("DUMMY")]);
  return expectInnerSuccess(closure, template, ...rest);
};

export const expectSuccessAsync = (promise, template, ...rest) => {
  format(template, [...rest, new Error("DUMMY")]);
  return expectInnerSuccessAsync(promise, template, ...rest);
};
