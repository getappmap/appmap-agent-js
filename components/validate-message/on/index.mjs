const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

export const { validateMessage } = await import(
  `../../validate/index.mjs${__search}`
);
