import { defineGlobal } from "../../global/index.mjs";

const { Promise, Error, undefined } = globalThis;

let buffer = null;

defineGlobal("GET_LAST_MOCK_SOCKET_BUFFER", () => buffer);

export const createSocket = (_configuration) => {
  buffer = [];
  return {
    ready: { value: false },
    buffer,
  };
};

export const isSocketReady = ({ ready }) => ready.value;

export const openSocketAsync = ({ ready }) => {
  ready.value = true;
  return Promise.resolve(undefined);
};

export const sendSocket = ({ buffer, ready }, message) => {
  if (ready.value) {
    buffer.push(message);
  } else {
    throw new Error("socket not ready");
  }
};

export const closeSocketAsync = ({ ready }) => {
  ready.value = false;
  return Promise.resolve(undefined);
};
