const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { constant } = await import(`../../util/index.mjs${__search}`);

export const extractRepositoryHistory = constant(null);

export const extractRepositoryPackage = constant(null);
