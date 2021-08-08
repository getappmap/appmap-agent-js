export default (dependencies) => {
  const {
    util: { generateDeadcode },
  } = dependencies;
  return {
    extractRepositoryHistory: generateDeadcode(
      "cannot extract repository history (disabled functionality)",
    ),
    extractRepositoryPackage: generateDeadcode(
      "cannot extract repository package (disabled functionality)",
    ),
    extractRepositoryDependencyPackage: generateDeadcode(
      "cannot extract repository dependency package (disabled functionality)",
    ),
  };
};
