const _Promise = Promise;
export default ({
  util: { assert, createBox, setBox, getBox },
  storage: { createStorage, store },
  backend: { openBackend, sendBackend, closeBackend },
}) => {
  const pipeStorage = (storage, storables) => {
    for (const { configuration, data } of storables) {
      store(storage, configuration, data);
    }
  };
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
      pipeStorage(storage, closeBackend(backend));
      getBox(box)();
    },
    sendClient: ({ storage, backend }, message) => {
      if (message !== null) {
        pipeStorage(storage, sendBackend(backend, message));
      }
    },
  };
};
