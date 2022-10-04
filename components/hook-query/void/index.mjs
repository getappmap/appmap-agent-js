const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { expect } = await import(`../../expect/index.mjs${__search}`);
export const { noop: unhook } = await import(`../../util/index.mjs${__search}`);

export const hook = (_agent, { hooks: { mysql, pg, sqlite3 } }) => {
  expect(
    !mysql && !pg && !sqlite3,
    "expected configuration to disable query hooks (mysql && pg && sqlite3)",
  );
};
