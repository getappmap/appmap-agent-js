const { Set, Error, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { logInfo } = await import(`../../log/index.mjs${__search}`);
const { expect } = await import(`../../expect/index.mjs${__search}`);
const { hook, unhook } = await import(`../../hook/index.mjs${__search}`);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { isConfigurationEnabled, extendConfigurationNode } = await import(
  `../../configuration-accessor/index.mjs${__search}`
);
const {
  openAgent,
  closeAgent,
  recordError: recordAgentError,
  recordStartTrack: recordAgentStartTrack,
  recordStopTrack: recordAgentStopTrack,
  requestRemoteAgentAsync,
} = await import(`../../agent/index.mjs${__search}`);

export const createRecorder = (process, configuration) => {
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
      recordAgentError(agent, name, message, stack);
    });
    process.on("exit", (status, _signal) => {
      for (const track of tracks) {
        recordAgentStopTrack(agent, track, status);
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
};

export const generateRequestAsync =
  ({ agent }) =>
  (method, path, body) =>
    requestRemoteAgentAsync(agent, method, path, body);

export const recordStartTrack = (
  { agent, tracks },
  track,
  configuration,
  url,
) => {
  assert(!tracks.has(track), "duplicate track");
  tracks.add(track);
  recordAgentStartTrack(agent, track, configuration, url);
};

export const recordStopTrack = ({ agent, tracks }, track, status) => {
  assert(tracks.has(track), "missing track");
  tracks.delete(track);
  recordAgentStopTrack(agent, track, status);
};
