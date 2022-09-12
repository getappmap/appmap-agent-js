export default (dependencies) => {
  const {
    util: { hasOwnProperty },
  } = dependencies;
  if (!hasOwnProperty(globalThis, "SOCKET_TRACE")) {
    globalThis.SOCKET_TRACE = [];
  }
  return {
    openSocket: (host, port) => {
      globalThis.SOCKET_TRACE.push({ type: "open", host, port });
      return "socket";
    },
    closeSocket: (socket) => {
      globalThis.SOCKET_TRACE.push({ type: "close", socket });
    },
    sendSocket: (socket, message) => {
      globalThis.SOCKET_TRACE.push({ type: "send", socket, message });
    },
  };
};
