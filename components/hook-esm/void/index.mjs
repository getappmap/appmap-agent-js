const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logErrorWhen } = await import(`../../log/index.mjs${__search}`);
const { assert, noop } = await import(`../../util/index.mjs${__search}`);

export const unhook = noop;

export const hook = (_agent, { hooks: { esm } }) => {
  assert(
    !logErrorWhen(esm, "No support for recording native modules"),
    "No support for recording native modules",
    ExternalAppmapError,
  );
};
