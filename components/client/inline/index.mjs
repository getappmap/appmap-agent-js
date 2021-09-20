const _Promise = Promise;
export default ({
  util: { bind, assert, createBox, setBox, getBox },
  storage: { createStorage, store },
  backend: { openBackend, sendBackend, closeBackend },
}) => {
  return {
    createClient: (configuration) => ({
      backend: openBackend(),
      storage: createStorage(),
      box: createBox(null),
    }),
    executeClientAsync: ({ box }) =>
      new _Promise((resolve) => {
        assert(getBox(box) === null, "client is already running");
        setBox(box, resolve);
      }),
    interruptClient: ({ storage, backend, box }) => {
      closeBackend(backend).forEach(bind(store, storage));
      getBox(box)();
    },
    sendClient: ({ storage, backend }, message) => {
      if (message !== null) {
        sendBackend(backend, message).forEach(bind(store, storage));
      }
    },
  };
};
