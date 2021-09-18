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
      const type = message[0];
      let result = EMPTY;
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
        for (const { events } of backend.tracks.values()) {
          events.push(event);
        }
      } else if (type === "file") {
        backend.files.push(message[1]);
      } else if (type === "start") {
        const key = message[1];
        assert(!backend.tracks.has(key), "duplicate track");
        backend.tracks.set(key, { initialization: message[2], events: [] });
      } else if (type === "stop") {
        const key = message[1];
        assert(backend.tracks.has(key), "missing track");
        assert(
          getBox(backend.configuration_box) !== null,
          "missing initialization (stop)",
        );
        result = [finalize(backend, key, message[2])];
      } else if (type === "initialize") {
        assert(
          getBox(backend.configuration_box) === null,
          "duplicate initialization",
        );
        setBox(backend.configuration_box, message[1]);
      } else if (type === "terminate") {
        assert(
          getBox(backend.configuration_box) !== null,
          "missing initialization (termination)",
        );
        result = toArray(backend.tracks.keys()).map((key) =>
          finalize(backend, key, message[1]),
        );
      } /* c8 ignore start */ else {
        assert(false, "invalid message");
      } /* c8 ignore stop */
      return result;
    },
    closeBackend: (backend) => {
      if (getBox(backend.configuration_box) === null) {
        return [];
      }
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
