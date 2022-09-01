export default (dependencies) => {
  return {
    compileTrace: (configuration, messages) => ({
      head: configuration,
      body: messages,
    }),
  };
};
