import { createServer as createTCPServer } from "net";
import { tmpdir } from "os";
import NetSocketMessaging from "net-socket-messaging";
import Module from "module";
import { buildTestDependenciesAsync } from "../../build.mjs";
import { testAsync } from "./__fixture__.mjs";

const { patch: patchSocket } = NetSocketMessaging;

export const testAsync = async (port, runAsync) => {
  const server = createTCPServer();
  const buffer = [];
  server.on("connection", (socket) => {
    patchSocket(socket);
    socket.on("message", (message) => {
      buffer.push(message);
    });
    socket.on("close", () => {
      server.close();
    });
  });
  server.listen(port);
  await new Promise((resolve) => {
    server.on("listening", resolve);
  });
  await runAsync(port === 0 ? server.address().port : port);
  // server.close();
  await new Promise((resolve) => {
    server.on("close", resolve);
  });
  return buffer;
};
