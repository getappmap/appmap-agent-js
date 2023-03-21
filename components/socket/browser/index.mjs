import { InternalAppmapError } from "../../error/index.mjs";
import { logWarningWhen } from "../../log/index.mjs";
import { assert } from "../../util/index.mjs";

const { String, WebSocket } = globalThis;

export const openSocket = (host, port, { "http-switch": segment }) => {
  assert(
    typeof port === "number",
    "cannot use IPC communicate on browser",
    InternalAppmapError,
  );
  const buffer = [];
  const socket = new WebSocket(`ws://${host}:${port}/${String(segment)}`);
  socket.addEventListener("open", () => {
    for (const message of buffer) {
      socket.send(message);
    }
  });
  return { socket, buffer };
};

export const sendSocket = ({ socket, buffer }, message) => {
  if (socket.readyState === 0) {
    buffer.push(message);
  } else if (socket.readyState === 1) {
    socket.send(message);
  } else {
    logWarningWhen("Lost message >> %j", message);
  }
};

export const closeSocket = ({ socket }) => {
  socket.close();
};
