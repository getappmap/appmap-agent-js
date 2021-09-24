const _Promise = Promise;
export default (dependencies) => {
  const {
    uuid: { getUUID },
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
  } = dependencies;
  return {
    openClient: (configuration) => {
      const session = getUUID();
      const backend = createBackend();
      /* c8 ignore start */
      const responder = openResponder((method, path, body) =>
        _Promise.resolve(
          respondBackend(backend, method, `/${session}${path}`, body),
        ),
      );
      /* c8 ignore stop */
      if (configuration["local-track-port"] !== 0) {
        listenResponderAsync(responder, configuration["local-track-port"]);
      }
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
    trackClientAsync: async ({ backend, session }, method, path, body) => {
      const { storables, ...response } = respondBackend(
        backend,
        method,
        `/${session}${path}`,
        body,
      );
      storables.forEach(store);
      return response;
    },
    /* c8 ignore stop */
  };
};
