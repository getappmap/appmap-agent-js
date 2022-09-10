const {
  JSON: { stringify: stringifyJSON }
} = globalThis;

export default (dependencies) => {
  const {
    util: { generateDeadcode, assert, createBox, setBox, getBox },
    log: { logWarning },
    uuid: { getUUID },
    http: { requestAsync },
    socket: { openSocket, closeSocket, sendSocket },
  } = dependencies;
  return {
    openEmitter: (configuration) => {
      let {
        host: host,
        "trace-port": trace_port,
        "track-port": track_port,
        session,
      } = configuration;
      if (session === null) {
        session = getUUID();
      }
      if (host === "localhost") {
        host = "127.0.0.1";
      }
      const socket = openSocket(host, trace_port, configuration);
      sendSocket(socket, session);
      sendSocket(socket, stringifyJSON(configuration));
      return { socket, session, host, track_port, closed: createBox(false) };
    },
    closeEmitter: ({ socket, closed }) => {
      assert(!getBox(closed), "emitter has already been closed");
      setBox(closed, true);
      closeSocket(socket);
    },
    sendEmitter: ({ socket, closed }, message) => {
      if (getBox(closed)) {
        logWarning("message lost: %j", message);
      } else {
        sendSocket(socket, stringifyJSON(message));
      }
    },
    takeLocalEmitterTrace: generateDeadcode(
      "takeLocalEmitterTrace should not be called on emitter/remote-node-posix",
    ),
    /* c8 ignore start */
    requestRemoteEmitterAsync: (
      { host, track_port, session },
      method,
      path,
      body,
    ) => requestAsync(host, track_port, method, `/${session}${path}`, body),
    /* c8 ignore stop */
  };
};
