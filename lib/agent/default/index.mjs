export default (dependencies) => {
  const {
    util: { createBox, getBox },
    "hook-apply": { hookApply, unhookApply },
    "hook-group": { hookGroup, unhookQroup },
    "hook-module": { hookModule, unhookModule, transformSourceDefault },
    "hook-query": {hookQuery, unhookQuery},
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
      const promise = executeClientAsync(client);
      sendClient(client, initializeFrontend(frontend));
      const hook_apply = hookApply(client, frontend, configuration);
      const hook_group = hookApply(client, frontend, configuration);
      const hook_module = hookApply(client, frontend, configuration, transform);
      const hook_query = hookQuery(client, frontend, configuration);
      try {
        return await promise;
      } finally {
        unhookApply(hook_apply);
        unhookQroup(hook_group);
        unhookModule(hook_module);
        unhookQuery(hook_query);
      }
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
