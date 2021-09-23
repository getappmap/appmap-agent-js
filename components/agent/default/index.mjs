export default (dependencies) => {
  const {
    "hook-group": { hookGroup, unhookGroup },
    "hook-module": { hookModule, unhookModule },
    "hook-apply": { hookApply, unhookApply },
    "hook-request": { hookRequest, unhookRequest },
    "hook-response": { hookResponse, unhookResponse },
    "hook-query": { hookQuery, unhookQuery },
    interpretation: { runScript },
    frontend: {
      createFrontend,
      instrument,
      initializeFrontend,
      terminateFrontend,
      startTrack,
      stopTrack,
    },
    client: {
      openClient,
      trackClient,
      trackClientAsync,
      promiseClientTermination,
      traceClient,
      closeClient,
    },
  } = dependencies;
  return {
    openAgent: (configuration) => ({
      configuration,
      frontend: createFrontend(configuration),
      client: openClient(configuration),
    }),
    promiseAgentTermination: async ({ configuration, client, frontend }) => {
      traceClient(client, initializeFrontend(frontend));
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
    runManually: ({ frontend, client }, path, code1) => {
      const { message, code: code2 } = instrument(
        frontend,
        "script",
        path,
        code1,
      );
      if (message !== null) {
        traceClient(client, message);
      }
      return runScript(code2);
    },
    /* c8 ignore start */
    trackAgent: ({ client }, method, path, body) =>
      trackClient(client, method, path, body),
    trackAgentAsync: ({ client }, method, path, body) =>
      trackClientAsync(client, method, path, body),
    /* c8 ignore stop */
    closeAgent: ({ frontend, client }, termination) => {
      traceClient(client, terminateFrontend(frontend, termination));
      closeClient(client);
    },
    startTrack: ({ client, frontend }, track, initialization) => {
      traceClient(client, startTrack(frontend, track, initialization));
    },
    stopTrack: ({ client, frontend }, track, termination) => {
      traceClient(client, stopTrack(frontend, track, termination));
    },
  };
};
