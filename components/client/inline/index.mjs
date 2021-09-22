const _Promise = Promise;
export default ({
  uuid: { getUUID },
  util: { bind, assert, createBox, setBox, getBox },
  storage: { store },
  request: {
    openResponder,
    listenResponderAsync,
    promiseResponderTermination,
    closeResponder,
  },
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
      const responder = openResponder(bind(respondBackend, backend));
      listenResponderAsync(responder, configuration["remote-recording-port"]);
      openBackendSession(backend, key);
      return {
        responder,
        backend,
        key,
      };
    },
    promiseClientTermination: ({ responder }) =>
      promiseResponderTermination(responder),
    closeClient: ({ responder, backend, key }) => {
      closeBackendSession(backend, key).forEach(store);
      closeResponder(responder);
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
