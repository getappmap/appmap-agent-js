export default (dependencies) => {
  const {
    util: { constant },
    path: { joinPath },
  } = dependencies;
  return {
    extractRepositoryHistory: constant(null),
    extractRepositoryPackage: constant(null),
    extractRepositoryDependency: (directory, name) => ({
      directory: joinPath(joinPath(directory, "node_modules"), name),
      package: {
        name,
        version: "0.0.0",
        homepage: null,
      },
    }),
  };
};
