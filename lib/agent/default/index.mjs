export default (dependencies) => {
  const {
    util: { createBox, getBox },
    "hook-apply": { hookApplyAsync },
    "hook-group": { hookGroupAsync },
    "hook-module": { hookModuleAsync, transformSourceDefault },
    frontend: {
      createFrontend,
      initializeFrontend,
      terminateFrontend,
      createTrack,
      controlTrack,
    },
    client: { createClient, executeClientAsync, sendClient, interruptClient },
  } = dependencies;
  return {
    transformSourceDefault,
    createAgent: (configuration) => ({
      configuration,
      frontend: createFrontend(configuration),
      client: createClient(configuration),
      transform: createBox(transformSourceDefault),
    }),
    getCurrentTransformSource: ({ transform }) => getBox(transform),
    executeAgentAsync: async ({
      configuration,
      client,
      frontend,
      transform,
    }) => {
      const promise1 = executeClientAsync(client);
      sendClient(client, initializeFrontend(frontend));
      const promise2 = Promise.all([
        hookApplyAsync(promise1, client, frontend, configuration),
        hookGroupAsync(promise1, client, frontend, configuration),
        hookModuleAsync(promise1, client, frontend, configuration, transform),
      ]);
      const result = await promise1;
      await promise2;
      return result;
    },
    interruptAgent: ({ frontend, client }, termination) => {
      sendClient(client, terminateFrontend(frontend, termination));
      interruptClient(client);
    },
    createTrack: ({ frontend }, options) => createTrack(frontend, options),
    controlTrack: ({ client, frontend }, track, action) => {
      sendClient(client, controlTrack(frontend, track, action));
    },
  };
};
