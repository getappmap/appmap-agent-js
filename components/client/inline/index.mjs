const _Promise = Promise;
export default ({
  uuid: { getUUID },
  util: { bind, assert, createBox, setBox, getBox },
  storage: { store },
  backend: {
    createBackend,
    openBackendSession,
    sendBackend,
    respondBackend,
    closeBackendSession,
  },
}) => {
  return {
    createClient: (configuration) => {
      const key = getUUID();
      const backend = createBackend();
      openBackendSession(backend, key);
      return {
        backend,
        key,
        box: createBox(null),
      };
    },
    executeClientAsync: ({ backend, box }) =>
      new _Promise((resolve) => {
        assert(getBox(box) === null, "client is already running");
        setBox(box, resolve);
      }),
    interruptClient: ({ backend, key, box }) => {
      closeBackendSession(backend, key).forEach(store);
      getBox(box)();
    },
    sendClient: ({ backend, key }, message) => {
      if (message !== null) {
        sendBackend(backend, key, message).forEach(store);
      }
    },
    /* c8 ignore start */
    requestClientAsync: ({ backend }, method, path, body) =>
      _Promise.resolve(respondBackend(backend, method, path, body)),
    /* c8 ignore stop */
  };
};
