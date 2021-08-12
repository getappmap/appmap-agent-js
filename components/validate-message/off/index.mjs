export default (dependencies) => {
  const {
    util: { noop },
  } = dependencies;
  return {
    validateMessage: noop,
  };
};
