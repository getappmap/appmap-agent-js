const _Map = Map;
const { from: toArray } = Array;
const EMPTY = [];

export default (dependencies) => {
  const {
    util: { assert, createBox, setBox, getBox },
    configuration: { extendConfiguration },
    log: { logDebug },
    "validate-message": { validateMessage },
    trace: { compileTrace },
  } = dependencies;
  const finalize = ({ tracks, files, configuration_box }, key, termination) => {
    const { initialization, events } = tracks.get(key);
    tracks.delete(key);
    const configuration = extendConfiguration(
      getBox(configuration_box),
      initialization,
    );
    return {
      configuration,
      data: compileTrace(configuration, files, events, termination),
    };
  };
  return {
    openBackend: () => ({
      files: [],
      tracks: new _Map(),
      configuration_box: createBox(null),
    }),
    sendBackend: (backend, message) => {
      logDebug("backend received: %j", message);
      validateMessage(message);
      const [type, data] = message;
      let result = EMPTY;
      if (type === "event") {
        for (const { events } of backend.tracks.values()) {
          events.push(data);
        }
      } else if (type === "file") {
        backend.files.push(data);
      } else if (type === "start") {
        const { track: key, initialization } = data;
        assert(!backend.tracks.has(key), "duplicate track");
        backend.tracks.set(key, { initialization, events: [] });
      } else if (type === "stop") {
        const { track: key, termination } = data;
        assert(backend.tracks.has(key), "missing track");
        assert(
          getBox(backend.configuration_box) !== null,
          "missing initialization (stop)",
        );
        result = [finalize(backend, key, termination)];
      } else if (type === "initialize") {
        assert(
          getBox(backend.configuration_box) === null,
          "duplicate initialization",
        );
        setBox(backend.configuration_box, data);
      } else if (type === "terminate") {
        assert(
          getBox(backend.configuration_box) !== null,
          "missing initialization (termination)",
        );
        result = toArray(backend.tracks.keys()).map((key) =>
          finalize(backend, key, data),
        );
      } else {
        assert(false, "invalid message");
      }
      return result;
    },
    closeBackend: (backend) => {
      assert(
        getBox(backend.configuration_box) !== null,
        "missing initialization (stop)",
      );
      const termination = {
        errors: [{ name: "AppmapError", message: "client disconnection" }],
        status: 1,
      };
      return toArray(backend.tracks.keys()).map((key) =>
        finalize(backend, key, termination),
      );
    },
  };
};
