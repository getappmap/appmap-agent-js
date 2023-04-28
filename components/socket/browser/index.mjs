import { logError, logWarning } from "../../log/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { OPEN, CLOSED } from "./ready-state.mjs";

const {
  Promise,
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

export const createSocket = ({ "http-switch": segment }) => {
  const socket = new WebSocket(toWebSocketUrl(location, `/${segment}`));
  /* c8 ignore start */
  socket.addEventListener("error", (_event) => {
    logError("Websocket error at %j", socket.url);
    throw new InternalAppmapError("Websocket error");
  });
  /* c8 ignore stop */
  return socket;
};

export const openSocketAsync = async (socket) => {
  if (socket.readyState !== OPEN) {
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve);
      socket.addEventListener("error", reject);
    });
  }
};

export const isSocketReady = (socket) => socket.readyState === OPEN;

export const sendSocket = (socket, message) => {
  if (socket.readyState === OPEN) {
    socket.send(message);
  } else {
    logWarning("Lost message >> %s", message);
  }
};

export const closeSocketAsync = async (socket) => {
  socket.close();
  if (socket.readyState !== CLOSED) {
    await new Promise((resolve, reject) => {
      socket.addEventListener("close", resolve);
      socket.addEventListener("error", reject);
    });
  }
};
