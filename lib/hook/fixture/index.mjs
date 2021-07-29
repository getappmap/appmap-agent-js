export default (dependencies) => {
  const {
    util: { createBox },
    configuration: { createConfiguration, extendConfiguration },
    state: { createState, initializeState },
    client: { createClient, executeClientAsync, interruptClient },
  } = dependencies;
  return {
    testHookAsync: async (hookAsync, options, callbackAsync) => {
      const { conf, root, box } = {
        conf: null,
        root: "/cwd",
        box: createBox(),
        ...options,
      };
      const configuration = extendConfiguration(
        createConfiguration(root),
        { ...conf },
        root,
      );
      const state = createState();
      const client = createClient();
      initializeState(state, configuration);
      setTimeout(async () => {
        await callbackAsync(state);
        interruptClient(client);
      }, 0);
      const promise = executeClientAsync(client, configuration);
      await hookAsync(promise, client, state, configuration, box);
      return await promise;
    },
  };
};
