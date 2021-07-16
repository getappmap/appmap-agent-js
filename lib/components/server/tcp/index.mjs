import { createServer } from "net";
import { patch } from "net-socket-messaging";
import { logError } from "../../../util/index.mjs";

const global_JSON_parse = JSON.parse;

export const initializeServerAsync = (
  { initializeBackend, terminateBackend, sendBackend, awaitBackendTermination }) =>
  ({ port },
) => {
  const server = createServer();
  const sockets = new Set();
  server.on("error", () => {
    server.close();
    for (const socket of sockets) {
      socket.destroy();
    }
  });
  server.on("connection", (socket) => {
    patch(socket);
    const backend = initializeBackend();
    sockets.add(socket);
    socket.on("close", () => {
      sockets.delete(socket);
      terminateBackend(backend);
    });
    /* c8 ignore start */
    socket.on("error", (error) => {
      logError("tcp socket error >> %e", error);
      socket.destroy();
    });
    /* c8 ignore stop */
    awaitBackendTermination(backend)
      .catch((error) => {
        logError("backend error >> %e", error);
      })
      .finally(() => {
        socket.end();
      });
    socket.on("message", (message) => {
      sendBackend(backend, global_JSON_parse(message));
    });
  });
  return new Promise((resolve, reject) => {
    server.on("listening", (port) => {
      resolve({
        server,
        sockets,
        termination: new Promise((resolve, reject) => {
          server.on("error", reject);
          server.on("close", resolve);
        }),
      });
    });
    server.on("error", reject);
    server.listen(port);
  });
};

export const terminateServer = ({ server, sockets }) => {
  server.close();
  for (const socket of sockets) {
    socket.end();
  }
};

export const promiseServerTermination = ({ termination }) => termination;

export default ({ Backend }) => ({
  initializeServerAsync: initializeServerAsync(Backend),
  terminateServer,
  awaitServerTermination,
});
