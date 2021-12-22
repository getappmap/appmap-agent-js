const _WebSocket = WebSocket;

export default (dependencies) => {
  return {
    openSocket: (host, port) => {
      return new _WebSocket(`wss://${host}:${port}`);
    },
    sendSocket: (socket, message) => {
      return socket.send(message);
    },
    closeSocket: (socket) => {
      socket.close();
    },
  };
};
