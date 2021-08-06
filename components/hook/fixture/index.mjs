import { fileURLToPath } from "url";

export default (dependencies) => {
  const {
    util: { getDirectory },
  } = dependencies;
  const {
    configuration: { createConfiguration, extendConfiguration },
    frontend: { createFrontend, initializeFrontend },
    client: { createClient, executeClientAsync, interruptClient },
  } = dependencies;
  return {
    testHookAsync: async (hook, unhook, config, callbackAsync) => {
      const directory = getDirectory(fileURLToPath(import.meta.url));
      const configuration = extendConfiguration(
        createConfiguration(directory),
        { ...config },
        directory,
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
