import { createServer } from "net";
import { patch } from "net-socket-messaging";
import { logError } from "../../../util/index.mjs";

const global_JSON_parse = JSON.parse;

const onSocketError = (error) => {
  logError("tcp socket error >> %e", error);
};

export default ({ backend: { initializeBackend, terminateBackend, sendBackend } }, { port }) => ({
  terminateServer: ({server, sockets}) => {
    server.close();
    for (const socket of sockets) {
      socket.end();
    }
  },
  initializeServerAsync: () =>
    new Promise((resolve, reject) => {
      const server = createServer();
      const sockets = new Set();
      server.on("connection", (socket) => {
        patch(socket);
        const { termination, handle } = initializeBackend();
        sockets.add(socket);
        sockets.on("close", () => {
          sockets.delete(socket);
          terminateBackend(handle);
        });
        socket.on("error", onSocketError);
        termination.catch((error) => {
          logError("backend error >> %e", error);
          socket.send(error.message);
        }).finally(() => {
          socket.end();
        });
        socket.on("message", (message) => {
          sendBackend(handle, global_JSON_parse(message));
        });
      });
      server.on("error", reject);
      server.on("listening", () => {
        resolve({
          termination: new Promise((resolve, reject) => {
            server.on("error", (error) => {
              server.close();
              for (const socket of sockets) {
                socket.destroy();
              }
              reject(error);
            });
            server.on("close", resolve);
          }),
          handle: {server, sockets},
        });
      });
      server.listen(port);
    }),
});
