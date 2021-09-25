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
    openClient: ({ "local-track-port": local_track_port }) => {
      const session = getUUID();
      const backend = createBackend();
      const responder = openResponder((method, path, body) =>
        _Promise.resolve(
          respondBackend(backend, method, `/${session}${path}`, body),
        ),
      );
      openBackendSession(backend, session);
      return {
        local_track_port,
        responder,
        backend,
        session,
      };
    },
    listenClientAsync: async ({ responder, local_track_port }) => {
      if (local_track_port !== null) {
        await listenResponderAsync(responder, local_track_port);
      }
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
  };
};
