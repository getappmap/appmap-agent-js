export default (dependencies) => {
  const {
    util: { createBox },
    configuration: { createConfiguration, extendConfiguration },
    frontend: { createFrontend, initializeFrontend },
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
      const frontend = createFrontend();
      const client = createClient();
      initializeFrontend(frontend, configuration);
      setTimeout(async () => {
        await callbackAsync(frontend);
        interruptClient(client);
      }, 0);
      const promise = executeClientAsync(client, configuration);
      await hookAsync(promise, client, frontend, configuration, box);
      return await promise;
    },
  };
};
