const _Promise = Promise;
export default ({
  uuid: { getUUID },
  util: { bind, assert, createBox, setBox, getBox },
  storage: { store },
  request: { openServer, listenAsync, promiseServerTermination, closeServer },
  backend: {
    createBackend,
    openBackendSession,
    sendBackend,
    respondBackend,
    closeBackendSession,
  },
}) => {
  return {
    openClient: (configuration) => {
      const key = getUUID();
      const backend = createBackend();
      const server = openServer(bind(respondBackend, backend));
      listenAsync(server, configuration["remote-recording-port"]);
      openBackendSession(backend, key);
      return {
        server,
        backend,
        key,
      };
    },
    promiseClientTermination: ({ server }) => promiseServerTermination(server),
    closeClient: ({ server, backend, key }) => {
      closeBackendSession(backend, key).forEach(store);
      closeServer(server);
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
