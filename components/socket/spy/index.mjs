const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { hasOwnProperty } = await import(`../../util/index.mjs${__search}`);

if (!hasOwnProperty(globalThis, "SOCKET_TRACE")) {
  globalThis.SOCKET_TRACE = [];
}

export const openSocket = (host, port) => {
  globalThis.SOCKET_TRACE.push({ type: "open", host, port });
  return "socket";
};

export const closeSocket = (socket) => {
  globalThis.SOCKET_TRACE.push({ type: "close", socket });
};

export const sendSocket = (socket, message) => {
  globalThis.SOCKET_TRACE.push({ type: "send", socket, message });
};
