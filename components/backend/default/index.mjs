export default (dependencies) => {
  const {
    util: { assert, createBox, setBox, getBox },
    expect: { expectSuccess },
    log: { logDebug },
    "validate-message": { validateMessage },
    storage: { createStorage, store },
    trace: { compileTrace },
  } = dependencies;
  const persist = ({ trace, box }, reason) => {
    const configuration = getBox(box);
    setBox(box, null);
    const storage = createStorage(configuration);
    for (const { name, data } of compileTrace(configuration, trace, reason)) {
      expectSuccess(
        () => store(storage, name, data),
        "failed to store appmap >> %e",
      );
    }
  };

  return {
    openBackend: () => ({
      trace: [],
      box: createBox(null),
    }),
    sendBackend: (backend, message) => {
      logDebug("backend received: %j", message);
      validateMessage(message);
      const { type, data } = message;
      if (type === "trace") {
        const { trace } = backend;
        trace.push(data);
      } else if (type === "initialize") {
        const { box } = backend;
        setBox(box, data);
      } else {
        assert(type === "terminate", "invalid message type");
        const { box } = backend;
        assert(getBox(box) !== null, "backend has already been terminated");
        persist(backend, data);
      }
    },
    closeBackend: (backend) => {
      const { box } = backend;
      if (getBox(box) !== null) {
        persist(backend, {
          errors: [{ name: "AppmapError", message: "client disconnection" }],
          status: 1,
        });
      }
    },
  };
};
