const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

export const { noop: validateMessage } = await import(
  `../../util/index.mjs${__search}`
);
