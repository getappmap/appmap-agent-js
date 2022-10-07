const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

export const {
  expectDeadcode,
  expectDeadcodeAsync,
  expect,
  expectSuccess,
  expectSuccessAsync,
} = await import(`../../expect-inner/index.mjs${__search}`);
