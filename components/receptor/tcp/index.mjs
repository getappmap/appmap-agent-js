import { createServer } from "net";
import { patch } from "net-socket-messaging";

const _Promise = Promise;
const _Set = Set;
const { parse: parseJSON } = JSON;

export default (dependencies) => {
  const {
    backend: { openBackendSession, sendBackend, closeBackendSession },
    storage: { store },
    log: { logError },
  } = dependencies;
  return {
    openReceptorAsync: (backend, options) => {
      const { port } = { port: 0, ...options };
      const server = createServer();
      const sockets = new _Set();
      server.on("error", (error) => {
        server.close();
        for (const socket of sockets) {
          socket.destroy();
        }
      });
      server.on("connection", (socket) => {
        patch(socket);
        sockets.add(socket);
        socket.on("close", () => {
          sockets.delete(socket);
        });
        /* c8 ignore start */
        socket.on("error", (error) => {
          logError("tcp socket error >> %e", error);
          socket.destroy();
        });
        /* c8 ignore stop */
        socket.on("message", (key) => {
          openBackendSession(backend, key);
          socket.removeAllListeners("message");
          socket.on("close", () => {
            closeBackendSession(backend, key).forEach(store);
          });
          socket.on("message", (message) => {
            sendBackend(backend, key, parseJSON(message)).forEach(store);
          });
        });
      });
      return new Promise((resolve, reject) => {
        server.on("listening", (port) => {
          resolve({
            server,
            sockets,
            termination: new _Promise((resolve, reject) => {
              server.on("error", reject);
              server.on("close", resolve);
            }),
          });
        });
        server.on("error", reject);
        server.listen(port);
      });
    },
    promiseReceptorTermination: ({ termination }) => termination,
    closeReceptor: ({ server, sockets }) => {
      server.close();
      for (const socket of sockets) {
        socket.end();
      }
    },
    getReceptorPort: ({ server }) => {
      const address = server.address();
      if (typeof address === "string") {
        return address;
      }
      const { port } = address;
      return port;
    },
  };
};
