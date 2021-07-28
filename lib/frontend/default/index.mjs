
export default = (dependencies) => {
  const {
    "hook-apply": {hookApplyAsync},
    "hook-group": {hookGroupAsync},
    "hook-module": {hookModuleAsync},
    "hook-query": {hookQueryAsync},
    "hook-request": {hookRequestAsync},
    "hook-response": {hookResponseAsync},
    frontend: {createFrontend, initializeFrontend, terminateFrontend},
    client: {createClient, initializeClient, terminateClient},
  } = dependencies;
  return {
    createFrontend: (configuration) => ({
      configuration,
      state: createState(configuration),
      client: createClient(configuration),
      box: createBox(null),
    }),
    initializeFrontend: ({client, state}) => {
      initializeClient(client);
      sendClient(client, initializeState(state));
    },
    terminateFrontend: ({client, box}, reason) => {
      sendClient(client, terminateState(state, reason));
      terminateClient(client);
    },
    runAsync: ({state, client, box, configuration}) => {
      const promise = asyncClienTermination(client);
      const args = {promise, client, state};
      return Promise.all([
        hookApplyAsync(args),
        hookGroupAsync(args),
        hookModuleAsync(args, box),
        hookQueryAsync(args),
        hookRequestAsync(args),
        hookResponseAsync(args),
      ]);
    },
    transformSource: ({box}, content, context, defaultTransformSource) => {
      const transformSource = getBox(box);
      if (transformSource === null) {
        return defaultTransformSource(content, context, defaultTransformSource);
      }
      return transformSource(content, context, defaultTransformSource);
    },
    createTrack: ({state}, options) => createTrack(state, options),
    controlTrack: ({client, state}, track, action) => {
      sendClient(client, controlTrack(state, track, action));
    },
  };
};
};
