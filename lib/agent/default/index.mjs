export default (dependencies) => {
  const {
    "hook-group": { hookGroup, unhookGroup },
    "hook-module": { hookModule, unhookModule },
    "hook-apply": { hookApply, unhookApply },
    "hook-request": { hookRequest, unhookRequest },
    "hook-response": { hookResponse, unhookResponse },
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
      const hook_group = hookGroup(client, frontend, configuration);
      const hook_module = hookModule(client, frontend, configuration);
      const hook_apply = hookApply(client, frontend, configuration);
      const hook_request = hookRequest(client, frontend, configuration);
      const hook_response = hookResponse(client, frontend, configuration);
      const hook_query = hookQuery(client, frontend, configuration);
      try {
        return await promise;
      } finally {
        unhookGroup(hook_group);
        unhookModule(hook_module);
        unhookApply(hook_apply);
        unhookRequest(hook_request);
        unhookResponse(hook_response);
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
