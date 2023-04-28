import { Socket } from "node:net";
import NetSocketMessaging from "net-socket-messaging";
import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";
import { logWarning } from "../../log/index.mjs";

const { Promise } = globalThis;

const { createMessage } = NetSocketMessaging;

export const createSocket = ({ host, "trace-port": port }) => {
  const socket = new Socket();
  if (typeof port === "string") {
    socket.connect(toIpcPath(convertFileUrlToPath(port)));
  } else {
    socket.connect(port, host);
  }
  socket.on("connect", () => {
    socket.unref();
  });
  return socket;
};

export const isSocketReady = (socket) => !socket.pending && socket.writable;

export const openSocketAsync = async (socket) => {
  if (socket.pending) {
    await new Promise((resolve, reject) => {
      socket.on("connect", resolve);
      socket.on("error", reject);
    });
  }
};

export const sendSocket = (socket, message) => {
  if (!socket.pending && socket.writable) {
    socket.write(createMessage(message));
  } else {
    logWarning("Lost message >> %s", message);
  }
};

export const closeSocketAsync = async (socket) => {
  if (!socket.writableFinished) {
    socket.end();
    await new Promise((resolve, reject) => {
      socket.on("finish", resolve);
      socket.on("error", reject);
    });
  }
};
