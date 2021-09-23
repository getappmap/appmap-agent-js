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
      const session = getUUID();
      const backend = createBackend();
      const responder = openResponder(bind(respondBackend, backend));
      listenResponderAsync(responder, configuration["track-port"]);
      openBackendSession(backend, session);
      return {
        responder,
        backend,
        session,
      };
    },
    promiseClientTermination: ({ responder }) =>
      promiseResponderTermination(responder),
    closeClient: ({ responder, backend, session }) => {
      closeBackendSession(backend, session).forEach(store);
      closeResponder(responder);
    },
    traceClient: ({ backend, session }, message) => {
      if (message !== null) {
        sendBackend(backend, session, message).forEach(store);
      }
    },
    /* c8 ignore start */
    trackClientAsync: ({ backend, session }, method, path, body) =>
      _Promise.resolve(
        respondBackend(backend, method, `/${session}${path}`, body),
      ),
    trackClient: ({ backend, session }, method, path, body) =>
      respondBackend(backend, method, `/${session}${path}`, body),
    /* c8 ignore stop */
  };
};
