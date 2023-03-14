import { defineGlobal, readGlobal } from "../../global/index.mjs";

defineGlobal("SOCKET_TRACE", []);

export const openSocket = (host, port) => {
  readGlobal("SOCKET_TRACE").push({ type: "open", host, port });
  return "socket";
};

export const closeSocket = (socket) => {
  readGlobal("SOCKET_TRACE").push({ type: "close", socket });
};

export const sendSocket = (socket, message) => {
  readGlobal("SOCKET_TRACE").push({ type: "send", socket, message });
};
