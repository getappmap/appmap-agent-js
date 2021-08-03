export default (dependencies) => {
  const {
    "hook-apply": { hookApply, unhookApply },
    "hook-group": { hookGroup, unhookGroup },
    "hook-module": { hookModule, unhookModule },
    "hook-query": { hookQuery, unhookQuery },
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
    createAgent: (configuration) => ({
      configuration,
      frontend: createFrontend(configuration),
      client: createClient(configuration),
    }),
    executeAgentAsync: async ({ configuration, client, frontend }) => {
      const promise = executeClientAsync(client);
      sendClient(client, initializeFrontend(frontend));
      const hook_apply = hookApply(client, frontend, configuration);
      const hook_group = hookGroup(client, frontend, configuration);
      const hook_module = hookModule(client, frontend, configuration);
      const hook_query = hookQuery(client, frontend, configuration);
      try {
        return await promise;
      } finally {
        unhookApply(hook_apply);
        unhookGroup(hook_group);
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
