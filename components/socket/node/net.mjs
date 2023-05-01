import { Socket } from "node:net";
import NetSocketMessaging from "net-socket-messaging";
import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";
import { logWarning } from "../../log/index.mjs";

const { patch } = NetSocketMessaging;

export const openSocket = ({ host, "trace-port": port }) => {
  const socket = new Socket();
  if (typeof port === "string") {
    socket.connect(toIpcPath(convertFileUrlToPath(port)));
  } else {
    socket.connect(port, host);
  }
  patch(socket);
  socket.on("connect", () => {
    socket.unref();
  });
  return socket;
};

export const addSocketListener = (socket, name, listener) => {
  socket.addListener(name === "open" ? "connect" : name, listener);
};

export const removeSocketListener = (socket, name, listener) => {
  socket.removeListener(name === "open" ? "connect" : name, listener);
};

export const isSocketReady = (socket) => !socket.pending && socket.writable;

export const closeSocket = (socket) => {
  socket.end();
};

export const sendSocket = (socket, message) => {
  if (!socket.pending && socket.writable) {
    socket.send(message);
  } else {
    logWarning("Lost message >> %s", message);
  }
};
