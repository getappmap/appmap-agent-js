const empty_history = {
  repository: null,
  branch: null,
  commit: null,
  status: null,
  tag: null,
  annotated_tag: null,
  commits_since_tag: null,
  commits_since_annotated_tag: null,
};

const empty_package = {
  name: null,
  version: null,
  homepage: null,
};

export default (dependencies) => {
  const {
    util: { constant },
  } = dependencies;
  return {
    extractRepositoryHistory: constant(empty_history),
    extractRepositoryPackage: constant(empty_package),
    extractRepositoryDependencyPackage: constant(empty_package),
  };
};
