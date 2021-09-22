import { fileURLToPath } from "url";

export default (dependencies) => {
  const {
    util: { getDirectory },
  } = dependencies;
  const {
    configuration: { createConfiguration, extendConfiguration },
    frontend: { createFrontend, initializeFrontend },
    client: { openClient, promiseClientTermination, closeClient },
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
      const client = openClient(configuration);
      const promise = promiseClientTermination(client);
      initializeFrontend(frontend);
      const h = hook(client, frontend, configuration);
      try {
        await callbackAsync(frontend);
        closeClient(client);
        return await promise;
      } finally {
        unhook(h);
      }
    },
  };
};
