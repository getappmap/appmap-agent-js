
const {Set, Error} = globalThis;

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
      recordError,
      recordStartTrack,
      recordStopTrack,
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
          recordError(agent, name, message, stack);
        });
        process.on("exit", (status, _signal) => {
          for (const track of tracks) {
            recordStopTrack(agent, track, status);
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
    recordStartTrack: ({ agent, tracks }, track, configuration, url) => {
      assert(!tracks.has(track), "duplicate track");
      tracks.add(track);
      recordStartTrack(agent, track, configuration, url);
    },
    recordStopTrack: ({ agent, tracks }, track, status) => {
      assert(tracks.has(track), "missing track");
      tracks.delete(track);
      recordStopTrack(agent, track, status);
    },
  };
};
