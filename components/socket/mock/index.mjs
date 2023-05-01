import {
  createEventTarget,
  addEventListener,
  removeEventListener,
  dispatchEvent,
} from "../../event/index.mjs";
import { defineGlobal } from "../../global/index.mjs";

const { setImmediate, Error } = globalThis;

let socket = null;

defineGlobal("GET_LAST_MOCK_SOCKET", () => socket);

defineGlobal("GET_MOCK_SOCKET_BUFFER", ({ buffer }) => buffer);

defineGlobal("RECEIVE_MOCK_SOCKET", ({ target }, message) => {
  setImmediate(dispatchEvent, target, "message", message);
});

export const openSocket = ({}) => {
  const target = createEventTarget();
  socket = {
    ready: { value: true },
    buffer: [],
    target,
  };
  setImmediate(dispatchEvent, target, "open", null);
  return socket;
};

export const addSocketListener = ({ target }, name, listener) => {
  addEventListener(target, name, listener);
};

export const removeSocketListener = ({ target }, name, listener) => {
  removeEventListener(target, name, listener);
};

export const isSocketReady = ({ ready }) => ready.value;

export const sendSocket = ({ buffer, ready }, message) => {
  if (ready.value) {
    buffer.push(message);
  } else {
    throw new Error("socket not ready");
  }
};

export const closeSocket = ({ ready, target }) => {
  if (ready.value) {
    ready.value = false;
    setImmediate(dispatchEvent, target, "close", null);
  }
};
