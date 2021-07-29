const _Promise = Promise;
export default ({
  backend: {
    createBackend,
    initializeBackend,
    sendBackend,
    terminateBackend,
  },
}) => ({
  createClient: () => ({
    backend: createBackend(),
    interrupt: createBox(null),
  }),
  executeClientAsync: ({backend, interrupt}, configuration) => new _Promise((resolve) => {
    initializeBackend(backend, configuration);
    setBox(interrupt, resolve);
  }),
  interruptClient: ({interrupt}) => {
    terminateBackend(backend);
    getBox(interrupt)();
  },
  sendClient: ({backend}, message) => {
    sendBackend(backend, message);
  },
});
