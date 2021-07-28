export default (dependencies) => {
  const {
    util: { createBox },
    configuration: { createConfiguration, extendConfiguration },
    state: { createState, initializeState },
    client: { initializeClient, terminateClient },
  } = dependencies;
  return {
    testHookAsync: async (hookAsync, options, callbackAsync) => {
      const { conf, root, box } = {
        conf: null,
        root: "/cwd",
        box: createBox(),
        ...options,
      };
      const buffer = [];
      const configuration = extendConfiguration(
        createConfiguration(root),
        {
          "client-spy-buffer": buffer,
          ...conf,
        },
        root,
      );
      const state = createState(configuration);
      const client = initializeClient(configuration);
      initializeState(state);
      setTimeout(async () => {
        await callbackAsync(state);
        terminateClient(client);
      }, 0);
      await hookAsync(client, state, configuration, box);
      return buffer;
    },
  };
};
