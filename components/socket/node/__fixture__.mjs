/* c8 ignore start */

import { createServer as createTcpServer } from "node:net";
import NetSocketMessaging from "net-socket-messaging";
import { getUuid } from "../../uuid/random/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { assertEqual } from "../../__fixture__.mjs";
import {
  getTmpUrl,
  toIpcPath,
  convertFileUrlToPath,
} from "../../path/index.mjs";

const { Promise } = globalThis;

const { patch: patchSocket } = NetSocketMessaging;

export const testAsync = async ({
  openSocket,
  addSocketListener,
  removeSocketListener,
  closeSocket,
  sendSocket,
  isSocketReady,
}) => {
  for (const port of [0, toAbsoluteUrl(getUuid(), getTmpUrl())]) {
    const server = createTcpServer();
    server.on("connection", (socket) => {
      patchSocket(socket);
      socket.on("message", (message) => {
        socket.send(`${message}|${message}`);
      });
    });
    server.listen(
      typeof port === "number" ? port : toIpcPath(convertFileUrlToPath(port)),
    );
    await new Promise((resolve) => {
      server.on("listening", resolve);
    });
    const socket = openSocket({
      host: "localhost",
      "trace-port": port === 0 ? server.address().port : port,
    });
    await new Promise((resolve) => {
      addSocketListener(socket, "open", resolve);
    });
    assertEqual(isSocketReady(socket), true);
    sendSocket(socket, "message");
    assertEqual(
      await new Promise((resolve) => {
        addSocketListener(socket, "message", resolve);
      }),
      "message|message",
    );
    closeSocket(socket);
    assertEqual(isSocketReady(socket), false);
    sendSocket(socket, "after");
    await new Promise((resolve) => {
      addSocketListener(socket, "close", resolve);
    });
    removeSocketListener(socket, "open", () => {});
    removeSocketListener(socket, "message", () => {});
    server.close();
    await new Promise((resolve) => {
      server.on("close", resolve);
    });
  }
};
