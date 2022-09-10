const {String, WebSocket} = globalThis;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  return {
    openSocket: (host, port) => {
      assert(typeof port === "number", "cannot use IPC communicate on browser");
      return new WebSocket(`wss://${host}:${String(port)}`);
    },
    sendSocket: (socket, message) => {
      return socket.send(message);
    },
    closeSocket: (socket) => {
      socket.close();
    },
  };
};
