import { createServer as createTCPServer } from "net";
import { convertPort } from "../__fixture__.mjs";
import NetSocketMessaging from "net-socket-messaging";

const { Promise } = globalThis;

const { patch: patchSocket } = NetSocketMessaging;

export const testAsync = async (port, runAsync) => {
  const server = createTCPServer();
  const buffer = [];
  const termination = new Promise((resolve) => {
    server.on("close", resolve);
  });
  server.on("connection", (socket) => {
    patchSocket(socket);
    socket.on("message", (message) => {
      buffer.push(message);
    });
    socket.on("close", () => {
      server.close();
    });
  });
  server.listen(convertPort(port));
  await new Promise((resolve) => {
    server.on("listening", resolve);
  });
  await runAsync(port === 0 ? server.address().port : port);
  await termination;
  return buffer;
};
