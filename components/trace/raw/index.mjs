export default (dependencies) => {
  return {
    compileTrace: (configuration, files, events, termination) => ({
      configuration,
      files,
      events,
      termination,
    }),
  };
};
