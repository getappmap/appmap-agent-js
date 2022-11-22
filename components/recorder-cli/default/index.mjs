const { Set, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { logInfo } = await import(`../../log/index.mjs${__search}`);
const { hook, unhook } = await import(`../../hook/index.mjs${__search}`);
const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { isConfigurationEnabled, extendConfigurationNode } = await import(
  `../../configuration-accessor/index.mjs${__search}`
);
const {
  openAgent,
  closeAgent,
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
    process.on("exit", (status) => {
      recordAgentStopTrack(agent, null, {
        type: "exit",
        status,
      });
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

export const recordStopTrack = ({ agent, tracks }, track, termination) => {
  assert(tracks.has(track), "missing track", InternalAppmapError);
  tracks.delete(track);
  recordAgentStopTrack(agent, track, termination);
};
