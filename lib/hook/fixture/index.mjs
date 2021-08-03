export default (dependencies) => {
  const {
    configuration: { createConfiguration, extendConfiguration },
    frontend: { createFrontend, initializeFrontend },
    client: { createClient, executeClientAsync, interruptClient },
  } = dependencies;
  return {
    testHookAsync: async (hook, unhook, options, callbackAsync) => {
      const { conf, cwd } = {
        conf: null,
        cwd: "/cwd",
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
      const h = hook(client, frontend, configuration);
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
