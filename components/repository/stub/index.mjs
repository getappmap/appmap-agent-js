export default (dependencies) => {
  const {
    util: { constant },
    url: { appendURLSegmentArray },
  } = dependencies;
  return {
    extractRepositoryHistory: constant(null),
    extractRepositoryPackage: constant(null),
    extractRepositoryDependency: (url, name) => ({
      directory: appendURLSegmentArray(url, ["node_modules", name]),
      package: {
        name,
        version: "0.0.0",
        homepage: null,
      },
    }),
  };
};
