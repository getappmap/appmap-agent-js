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
      startTrack,
      stopTrack,
    },
    client: { openClient, promiseClientTermination, sendClient, closeClient },
  } = dependencies;
  return {
    openAgent: (configuration) => ({
      configuration,
      frontend: createFrontend(configuration),
      client: openClient(configuration),
    }),
    promiseAgentTermination: async ({ configuration, client, frontend }) => {
      sendClient(client, initializeFrontend(frontend));
      const hook_group = hookGroup(client, frontend, configuration);
      const hook_module = hookModule(client, frontend, configuration);
      const hook_apply = hookApply(client, frontend, configuration);
      const hook_request = hookRequest(client, frontend, configuration);
      const hook_response = hookResponse(client, frontend, configuration);
      const hook_query = hookQuery(client, frontend, configuration);
      try {
        return await promiseClientTermination(client);
      } finally {
        unhookGroup(hook_group);
        unhookModule(hook_module);
        unhookApply(hook_apply);
        unhookRequest(hook_request);
        unhookResponse(hook_response);
        unhookQuery(hook_query);
      }
    },
    closeAgent: ({ frontend, client }, termination) => {
      sendClient(client, terminateFrontend(frontend, termination));
      closeClient(client);
    },
    createTrack: ({ frontend }, options) => createTrack(frontend, options),
    startTrack: ({ client, frontend }, track, initialization) => {
      sendClient(client, startTrack(frontend, track, initialization));
    },
    stopTrack: ({ client, frontend }, track, termination) => {
      sendClient(client, stopTrack(frontend, track, termination));
    },
  };
};
