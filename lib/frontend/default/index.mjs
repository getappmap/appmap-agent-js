export default (dependencies) => {
  const {
    util: { createBox, getBox },
    "hook-apply": { hookApplyAsync },
    "hook-group": { hookGroupAsync },
    "hook-module": { hookModuleAsync, transformSourceDefault },
    state: {
      createState,
      initializeState,
      terminateState,
      createTrack,
      controlTrack,
    },
    client: { createClient, executeClientAsync, sendClient, interruptClient },
  } = dependencies;
  return {
    createFrontend: () => ({
      state: createState(),
      client: createClient(),
      transform: createBox(transformSourceDefault),
    }),
    getCurrentTransformSource: ({ transform }) => getBox(transform),
    executeFrontendAsync: async (
      { client, state, transform },
      configuration,
    ) => {
      const promise1 = executeClientAsync(client, configuration);
      sendClient(client, initializeState(state, configuration));
      const promise2 = Promise.all([
        hookApplyAsync(promise1, client, state, configuration),
        hookGroupAsync(promise1, client, state, configuration),
        hookModuleAsync(promise1, client, state, configuration, transform),
      ]);
      const result = await promise1;
      await promise2;
      return result;
    },
    interruptFrontend: ({ state, client }, reason) => {
      sendClient(client, terminateState(state, reason));
      interruptClient(client);
    },
    createTrack: ({ state }, options) => createTrack(state, options),
    controlTrack: ({ client, state }, track, action) => {
      sendClient(client, controlTrack(state, track, action));
    },
  };
};
