const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logErrorWhen } = await import(`../../log/index.mjs${__search}`);
const { assert, noop } = await import(`../../util/index.mjs${__search}`);

export const unhook = noop;

export const hook = (_agent, { hooks: { mysql, pg, sqlite3 } }) => {
  assert(
    !logErrorWhen(
      mysql || pg || sqlite3,
      "No support for recording sql queries",
    ),
    "No support for recording sql queries",
    ExternalAppmapError,
  );
};
