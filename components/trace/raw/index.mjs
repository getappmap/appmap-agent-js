export default (dependencies) => {
  return {
    compileTrace: (configuration, sources, events, termination) => ({
      configuration,
      sources,
      events,
      termination,
    }),
  };
};
