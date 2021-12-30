const _WebSocket = WebSocket;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  return {
    openSocket: (host, port) => {
      assert(typeof port === "number", "cannot use IPC communicate on browser");
      return new _WebSocket(`wss://${host}:${String(port)}`);
    },
    sendSocket: (socket, message) => {
      return socket.send(message);
    },
    closeSocket: (socket) => {
      socket.close();
    },
  };
};
