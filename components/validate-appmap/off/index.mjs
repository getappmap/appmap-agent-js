export default (dependencies) => {
  const {
    util: { noop },
  } = dependencies;
  return {
    validateAppmap: noop,
  };
};
