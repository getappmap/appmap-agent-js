export default (dependencies) => {
  const {
    util: { createBox },
    configuration: { createConfiguration, extendConfiguration },
    frontend: { createFrontend, initializeFrontend },
    client: { createClient, executeClientAsync, interruptClient },
  } = dependencies;
  return {
    testHookAsync: async (hookAsync, options, callbackAsync) => {
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
      // TODO: investigate alternative async api:
      // const frontend = createFrontend(configuration);
      // const client = createClient(configuration);
      // initializeFrontend(frontend);
      // const hook = await startHookAsync(client, frontend, configuration, box);
      // await callbackAsync(frontend);
      // await stopHookAsync(hook);
      // interruptClient(client);
      // return await promiseClientTermination(client);
      const frontend = createFrontend(configuration);
      const client = createClient(configuration);
      initializeFrontend(frontend);
      const promise1 = executeClientAsync(client);
      const promise2 = hookAsync(
        promise1,
        client,
        frontend,
        configuration,
        box,
      );
      await callbackAsync(frontend);
      interruptClient(client);
      await promise2;
      return await promise1;
    },
  };
};
