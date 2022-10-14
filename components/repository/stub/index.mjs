const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { constant } = await import(`../../util/index.mjs${__search}`);

export const extractRepositoryHistory = constant(null);

export const extractRepositoryPackage = constant(null);

export const extractRepositoryDependency = (home, request) => ({
  directory: home,
  package: {
    name: request,
    version: "0.0.0",
    homepage: null,
  },
});
