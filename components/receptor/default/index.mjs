const _Map = Map;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const recorders = new _Map([
    ["remote", "receptor-http"],
    ["process", "receptor-file"],
    ["mocha", "receptor-file"],
  ]);
  return {
    minifyReceptorConfiguration: (configuration) => {
      assert(
        configuration.recorder !== null,
        "undefined recorder in configuration",
      );
      return dependencies[
        recorders.get(configuration.recorder)
      ].minifyReceptorConfiguration(configuration);
    },
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
