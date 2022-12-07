import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";

const { String, WebSocket } = globalThis;

export const openSocket = (host, port) => {
  assert(
    typeof port === "number",
    "cannot use IPC communicate on browser",
    InternalAppmapError,
  );
  return new WebSocket(`wss://${host}:${String(port)}`);
};

export const sendSocket = (socket, message) => {
  socket.send(message);
};

export const closeSocket = (socket) => {
  socket.close();
};
