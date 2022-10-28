const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);
export const { extractRepositoryPackage } = await import(
  `./package.mjs${__search}`
);
export const { extractRepositoryHistory } = await import(
  `./history.mjs${__search}`
);
