export default (dependencies) => {
  const {
    util: { constant, noop },
  } = dependencies;
  return {
    initializeGrouping: noop,
    getCurrentGroup: constant(0),
    terminateGrouping: noop,
  };
};
