const _Map = Map;

export default (dependencies) => {
  const {
    util: { assert },
    log: { logDebug },
    "validate-message": { validateMessage },
    trace: { compileTrace },
  } = dependencies;
  return {
    createBackend: (configuration) => ({
      configuration,
      sources: [],
      tracks: new _Map(),
      traces: new _Map(),
    }),
    getBackendTrackIterator: ({ tracks }) => tracks.keys(),
    getBackendTraceIterator: ({ traces }) => traces.keys(),
    hasBackendTrack: ({ tracks }, key) => tracks.has(key),
    hasBackendTrace: ({ traces }, key) => traces.has(key),
    takeBackendTrace: ({ traces }, key) => {
      assert(traces.has(key), "missing trace");
      const trace = traces.get(key);
      traces.delete(key);
      return trace;
    },
    sendBackend: ({ configuration, sources, tracks, traces }, message) => {
      validateMessage(message);
      logDebug("message >> %j", message);
      const { type } = message;
      if (type === "start") {
        const { track: key } = message;
        assert(!tracks.has(key), "duplicate track");
        tracks.set(key, [].concat(sources, [message]));
      } else if (type === "stop") {
        const { track: key } = message;
        assert(tracks.has(key), "missing track");
        assert(!traces.has(key), "duplicate trace");
        const messages = tracks.get(key);
        messages.push(message);
        tracks.delete(key);
        traces.set(key, compileTrace(configuration, messages));
      } else {
        if (type === "source") {
          sources.push(message);
        }
        for (const messages of tracks.values()) {
          messages.push(message);
        }
      }
      return type === "stop";
    },
  };
};
