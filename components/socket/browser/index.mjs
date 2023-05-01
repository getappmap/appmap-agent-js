import { logWarning } from "../../log/index.mjs";
import { OPEN } from "./ready-state.mjs";

const {
  WeakMap,
  URL,
  WebSocket,
  TextDecoder,
  window: { location },
} = globalThis;

const cache = new WeakMap();

const toWebSocketUrl = (base, path) => {
  const url_obj = new URL(base);
  url_obj.protocol = "ws:";
  url_obj.pathname = path;
  return url_obj.toString();
};

export const openSocket = ({ "http-switch": segment }) =>
  new WebSocket(toWebSocketUrl(location, `/${segment}`));

export const addSocketListener = (socket, name, listener) => {
  if (name === "message") {
    const old_listener = listener;
    const new_listener = ({ data }) => {
      listener(new TextDecoder().decode(data));
    };
    cache.set(old_listener, new_listener);
    socket.addEventListener(name, new_listener);
  } else {
    socket.addEventListener(name, listener);
  }
};

export const removeSocketListener = (socket, name, listener) => {
  socket.removeEventListener(
    name,
    cache.has(listener) ? cache.get(listener) : listener,
  );
};

export const isSocketReady = (socket) => socket.readyState === OPEN;

export const sendSocket = (socket, message) => {
  if (socket.readyState === OPEN) {
    socket.send(message);
  } else {
    logWarning("Lost message >> %s", message);
  }
};

export const closeSocket = (socket) => {
  socket.close();
};
