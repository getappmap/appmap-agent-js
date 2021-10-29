const _Map = Map;

export default (dependencies) => {
  const recorders = new _Map([
    ["remote", "receptor-http"],
    ["process", "receptor-file"],
    ["mocha", "receptor-file"],
  ]);
  return {
    minifyReceptorConfiguration: (configuration) =>
      dependencies[
        recorders.get(configuration.recorder)
      ].minifyReceptorConfiguration(configuration),
    openReceptorAsync: async (configuration) => ({
      recorder: configuration.recorder,
      receptor: await dependencies[
        recorders.get(configuration.recorder)
      ].openReceptorAsync(configuration),
    }),
    closeReceptorAsync: async ({ recorder, receptor }) => {
      await dependencies[recorders.get(recorder)].closeReceptorAsync(receptor);
    },
    adaptReceptorConfiguration: ({ recorder, receptor }, configuration) =>
      dependencies[recorders.get(recorder)].adaptReceptorConfiguration(
        receptor,
        configuration,
      ),
  };
};
