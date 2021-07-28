export default (dependencies) => {
  const {
    assert: { assertDeadcode },
  } = dependencies;
  return {
    extractRepositoryHistory: assertDeadcode(
      "cannot extract repository history from %j (disabled functionality)",
    ),
    extractRepositoryPackage: assertDeadcode(
      "cannot extract repository package from %j (disabled functionality)",
    ),
    extractRepositoryDependencyPackage: assertDeadcode(
      "cannot extract repository dependency package from %j (disabled functionality)",
    ),
  };
};
