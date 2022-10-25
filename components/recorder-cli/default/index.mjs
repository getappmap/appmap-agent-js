const { Set, Error, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { logInfo, logErrorWhen } = await import(
  `../../log/index.mjs${__search}`
);
const { hook, unhook } = await import(`../../hook/index.mjs${__search}`);
const { InternalAppmapError, ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
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
      assert(
        !logErrorWhen(
          !(error instanceof Error),
          "Expected uncaught error to be an instance of Error, got: %o",
          error,
        ),
        "Uncaught error is not an actual error",
        ExternalAppmapError,
      );
      const { name, message, stack } = error;
      assert(
        !logErrorWhen(
          typeof name !== "string",
          "Expected uncaught error's name to be a string, got: %o",
          name,
        ),
        "Uncaught error name is not a string",
        ExternalAppmapError,
      );
      assert(
        !logErrorWhen(
          typeof message !== "string",
          "Expected uncaught error's message to be a string, got: %o",
          message,
        ),
        "Uncaught error message is not a string",
        ExternalAppmapError,
      );
      assert(
        !logErrorWhen(
          typeof stack !== "string",
          "Expected uncaught error's stack to be a string, got: %o",
          stack,
        ),
        "Uncaught error stack is not a string",
        ExternalAppmapError,
      ),
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
  assert(!tracks.has(track), "duplicate track", InternalAppmapError);
  tracks.add(track);
  recordAgentStartTrack(agent, track, configuration, url);
};

export const recordStopTrack = ({ agent, tracks }, track, status) => {
  assert(tracks.has(track), "missing track", InternalAppmapError);
  tracks.delete(track);
  recordAgentStopTrack(agent, track, status);
};
