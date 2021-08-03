export default (dependencies) => {
  const {
    util: { createBox },
    configuration: { createConfiguration, extendConfiguration },
    frontend: { createFrontend, initializeFrontend },
    client: { createClient, executeClientAsync, interruptClient },
  } = dependencies;
  return {
    testHookAsync: async (hook, unhook, options, callbackAsync) => {
      const { conf, cwd, box } = {
        conf: null,
        cwd: "/cwd",
        box: createBox(null),
        ...options,
      };
      const configuration = extendConfiguration(
        createConfiguration(cwd),
        { ...conf },
        cwd,
      );
      const frontend = createFrontend(configuration);
      const client = createClient(configuration);
      const promise = executeClientAsync(client);
      initializeFrontend(frontend);
      const h = hook(client, frontend, configuration, box);
      try {
        await callbackAsync(frontend);
        interruptClient(client);
        return await promise;
      } finally {
        unhook(h);
      }
    },
  };
};
