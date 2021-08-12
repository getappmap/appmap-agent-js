export default (dependencies) => {
  const {
    validate: { validateMessage },
  } = dependencies;
  return {
    validateMessage,
  };
};
