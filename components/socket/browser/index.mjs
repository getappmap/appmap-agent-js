import { logError, logWarningWhen } from "../../log/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { CONNECTING, OPEN } from "./ready-state.mjs";

const {
  URL,
  WebSocket,
  window: { location },
} = globalThis;

const toWebSocketUrl = (base, path) => {
  const url_obj = new URL(base);
  url_obj.protocol = "ws:";
  url_obj.pathname = path;
  return url_obj.toString();
};

export const openSocket = ({ "http-switch": segment }) => {
  const buffer = [];
  const socket = new WebSocket(toWebSocketUrl(location, `/${segment}`));
  socket.addEventListener("open", () => {
    for (const message of buffer) {
      socket.send(message);
    }
  });
  /* c8 ignore start */
  socket.addEventListener("error", () => {
    logError("Websocket error at %j", socket.url);
    throw new InternalAppmapError("Websocket connection error");
  });
  /* c8 ignore stop */
  return { socket, buffer };
};

export const sendSocket = ({ socket, buffer }, message) => {
  if (socket.readyState === CONNECTING) {
    buffer.push(message);
  } else if (socket.readyState === OPEN) {
    socket.send(message);
  } else {
    logWarningWhen("Lost message >> %j", message);
  }
};

export const closeSocket = ({ socket }) => {
  socket.close();
};
