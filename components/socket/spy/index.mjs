export default (dependencies) => {
  const {
    util: { hasOwnProperty },
  } = dependencies;
  if (!hasOwnProperty(global, "SOCKET_TRACE")) {
    global.SOCKET_TRACE = [];
  }
  return {
    openSocket: (host, port) => {
      global.SOCKET_TRACE.push({ type: "open", host, port });
      return "socket";
    },
    closeSocket: (socket) => {
      global.SOCKET_TRACE.push({ type: "close", socket });
    },
    sendSocket: (socket, message) => {
      global.SOCKET_TRACE.push({ type: "send", socket, message });
    },
  };
};
