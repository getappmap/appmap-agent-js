const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { constant } = await import(`../../util/index.mjs${__search}`);
const { appendURLSegmentArray } = await import(
  `../../url/index.mjs${__search}`
);

export const extractRepositoryHistory = constant(null);

export const extractRepositoryPackage = constant(null);

export const extractRepositoryDependency = (url, segments) => ({
  directory: appendURLSegmentArray(url, ["node_modules", ...segments]),
  package: {
    name: segments.join("/"),
    version: "0.0.0",
    homepage: null,
  },
});
