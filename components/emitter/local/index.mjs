export default (dependencies) => {
  const {
    log: { logWarning },
    util: { assert, generateDeadcode, createBox, getBox, setBox },
    backend: {
      createBackend,
      sendBackend,
      getBackendTrackIterator,
      takeBackendTrace,
    },
  } = dependencies;
  return {
    openEmitter: (configuration) => ({
      closed: createBox(false),
      backend: createBackend(configuration),
    }),
    closeEmitter: ({ closed, backend }) => {
      const termination = {
        status: 1,
        errors: [
          {
            name: "AppmapError",
            message: "disconnection",
            stack: "",
          },
        ],
      };
      assert(!getBox(closed), "closeClient called on already closed client");
      setBox(closed, true);
      for (const key of getBackendTrackIterator(backend)) {
        sendBackend(backend, ["stop", key, termination]);
      }
    },
    sendEmitter: ({ backend, closed }, message) => {
      if (getBox(closed)) {
        logWarning("message lost: %j", message);
      } else {
        sendBackend(backend, message);
      }
    },
    takeLocalEmitterTrace: ({ backend }, key) =>
      takeBackendTrace(backend, key).body,
    requestRemoteEmitterAsync: generateDeadcode(
      "requestRemoteEmitterAsync should not be called on emitter/local",
    ),
  };
};
