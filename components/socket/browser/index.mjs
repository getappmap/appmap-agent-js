const { URL, String, WebSocket } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert } = await import(`../../util/index.mjs${__search}`);

export const openSocket = (host, port) => {
  assert(typeof port === "number", "cannot use IPC communicate on browser");
  return new WebSocket(`wss://${host}:${String(port)}`);
};

export const sendSocket = (socket, message) => {
  socket.send(message);
};

export const closeSocket = (socket) => {
  socket.close();
};
