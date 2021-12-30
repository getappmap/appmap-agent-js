export default (dependencies) => {
  const {
    util: { constant },
    url: { appendURLSegmentArray },
  } = dependencies;
  return {
    extractRepositoryHistory: constant(null),
    extractRepositoryPackage: constant(null),
    extractRepositoryDependency: (url, segments) => ({
      directory: appendURLSegmentArray(url, ["node_modules", ...segments]),
      package: {
        name: segments.join("/"),
        version: "0.0.0",
        homepage: null,
      },
    }),
  };
};
