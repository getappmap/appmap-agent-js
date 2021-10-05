const _Map = Map;

export default (dependencies) => {
  const {
    util: { assert },
    "validate-message": { validateMessage },
    trace: { compileTrace },
    configuration: { extendConfiguration },
  } = dependencies;
  return {
    createBackend: (configuration) => ({
      configuration,
      files: [],
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
    sendBackend: ({ configuration, files, tracks, traces }, message) => {
      validateMessage(message);
      const type = message[0];
      if (type === "event") {
        const event = {
          type: message[1],
          index: message[2],
          time: message[3],
          data: {
            type: message[4],
            ...message[5],
          },
        };
        for (const { events } of tracks.values()) {
          events.push(event);
        }
      } else if (type === "file") {
        files.push(message[1]);
      } else if (type === "start") {
        const [, key, initialization] = message;
        assert(!tracks.has(key), "duplicate track");
        tracks.set(key, {
          configuration: extendConfiguration(
            configuration,
            initialization.data,
            initialization.path,
          ),
          events: [],
        });
      } else if (type === "stop") {
        const [, key, termination] = message;
        assert(tracks.has(key), "missing track");
        assert(!traces.has(key), "duplicate trace");
        const { events, configuration } = tracks.get(key);
        tracks.delete(key);
        traces.set(key, {
          head: configuration,
          body: compileTrace(configuration, files, events, termination),
        });
      } /* c8 ignore start */ else {
        assert(false, "invalid message type");
      } /* c8 ignore stop */
      return type === "stop";
    },
  };
};
