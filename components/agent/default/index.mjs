export default (dependencies) => {
  const {
    "hook-group": { hookGroup, unhookGroup },
    "hook-module": { hookModule, unhookModule },
    "hook-apply": { hookApply, unhookApply },
    "hook-request": { hookRequest, unhookRequest },
    "hook-response": { hookResponse, unhookResponse },
    "hook-query": { hookQuery, unhookQuery },
    interpretation: { runScript },
    source: { createMirrorSourceMap },
    frontend: { createFrontend, instrument, startTrack, stopTrack },
    emitter: {
      openEmitter,
      closeEmitter,
      sendEmitter,
      requestRemoteEmitterAsync,
      takeLocalEmitterTrace,
    },
  } = dependencies;
  return {
    openAgent: (configuration) => {
      const emitter = openEmitter(configuration);
      const frontend = createFrontend(configuration);
      return {
        frontend,
        emitter,
        group_hook: hookGroup(emitter, frontend, configuration),
        module_hook: hookModule(emitter, frontend, configuration),
        apply_hook: hookApply(emitter, frontend, configuration),
        request_hook: hookRequest(emitter, frontend, configuration),
        response_hook: hookResponse(emitter, frontend, configuration),
        query_hook: hookQuery(emitter, frontend, configuration),
      };
    },
    closeAgent: (
      {
        frontend,
        emitter,
        group_hook,
        module_hook,
        apply_hook,
        request_hook,
        response_hook,
        query_hook,
      },
      termination,
    ) => {
      closeEmitter(emitter);
      unhookGroup(group_hook);
      unhookModule(module_hook);
      unhookApply(apply_hook);
      unhookRequest(request_hook);
      unhookResponse(response_hook);
      unhookQuery(query_hook);
    },
    recordAgentScript: ({ frontend, emitter }, file) => {
      const { messages, content: instrumented_content } = instrument(
        frontend,
        {
          ...file,
          type: "script",
        },
        createMirrorSourceMap(file),
      );
      for (const message of messages) {
        sendEmitter(emitter, message);
      }
      const { url } = file;
      return runScript(instrumented_content, url);
    },
    takeLocalAgentTrace: ({ emitter }, key) =>
      takeLocalEmitterTrace(emitter, key),
    /* c8 ignore start */
    requestRemoteAgentAsync: ({ emitter }, method, path, body) =>
      requestRemoteEmitterAsync(emitter, method, path, body),
    /* c8 ignore stop */
    startTrack: ({ emitter, frontend }, key, initialization) => {
      sendEmitter(emitter, startTrack(frontend, key, initialization));
    },
    stopTrack: ({ emitter, frontend }, key, termination) => {
      sendEmitter(emitter, stopTrack(frontend, key, termination));
    },
  };
};
