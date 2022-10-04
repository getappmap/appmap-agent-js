const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { expect } = await import(`../../expect/index.mjs${__search}`);
export const { noop: unhook } = await import(`../../util/index.mjs${__search}`);

export const hook = (_agent, { hooks: { cjs } }) => {
  expect(!cjs, "expected configuration to disable cjs module hook");
};
