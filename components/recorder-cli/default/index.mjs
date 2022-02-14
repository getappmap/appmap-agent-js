export default (dependencies) => {
  const {
    log: { logInfo },
    expect: { expect },
    hook: { hook, unhook },
    util: { assert },
    "configuration-accessor": {
      isConfigurationEnabled,
      extendConfigurationNode,
    },
    agent: {
      openAgent,
      closeAgent,
      startTrack,
      stopTrack,
      requestRemoteAgentAsync,
    },
  } = dependencies;
  return {
    createRecorder: (process, configuration) => {
      configuration = extendConfigurationNode(configuration, process);
      const enabled = isConfigurationEnabled(configuration);
      logInfo(
        "%s process #%j -- %j",
        enabled ? "Recording" : "*Not* recording",
        process.pid,
        process.argv,
      );
      if (enabled) {
        const agent = openAgent(configuration);
        const hooking = hook(agent, configuration);
        const tracks = new Set();
        const errors = [];
        process.on("uncaughtExceptionMonitor", (error) => {
          expect(
            error instanceof Error,
            "expected uncaught error to be an instance of Error, got: %o",
            error,
          );
          const { name, message, stack } = error;
          expect(
            typeof name === "string",
            "expected uncaught error's name to be a string, got: %o",
            name,
          );
          expect(
            typeof message === "string",
            "expected uncaught error's message to be a string, got: %o",
            message,
          );
          expect(
            typeof stack === "string",
            "expected uncaught error's stack to be a string, got: %o",
            stack,
          );
          errors.push({ name, message, stack });
        });
        process.on("exit", (status, signal) => {
          for (const track of tracks) {
            stopTrack(agent, track, { errors, status });
          }
          unhook(hooking);
          closeAgent(agent);
        });
        return {
          agent,
          tracks,
        };
      } else {
        return null;
      }
    },
    generateRequestAsync:
      ({ agent }) =>
      (method, path, body) =>
        requestRemoteAgentAsync(agent, method, path, body),
    startTrack: ({ agent, tracks }, track, initialization) => {
      assert(!tracks.has(track), "duplicate track");
      tracks.add(track);
      startTrack(agent, track, initialization);
    },
    stopTrack: ({ agent, tracks }, track, termination) => {
      assert(tracks.has(track), "missing track");
      tracks.delete(track);
      stopTrack(agent, track, termination);
    },
  };
};
