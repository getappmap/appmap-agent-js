const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { expect } = await import(`../../expect/index.mjs${__search}`);
export const { noop: unhook } = await import(`../../util/index.mjs${__search}`);

export const hook = (_agent, { ordering }) => {
  expect(
    ordering !== "causal",
    "expected configuration to disable group re-ordering",
  );
};
