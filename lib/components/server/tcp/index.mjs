import { createServer } from "net";
import { patch } from "net-socket-messaging";

const { parse: global_JSON_parse } = JSON;

export default (dependencies) => {
  const {
    backend: {
      initializeBackend,
      terminateBackend,
      sendBackend,
      asyncBackendTermination,
    },
    log: { logError },
  } = dependencies;
  return {
    initializeServerAsync: (options) => {
      const { port } = {
        port: 0,
        ...options,
      };
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
        asyncBackendTermination(backend)
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
    },
    terminateServer: ({ server, sockets }) => {
      server.close();
      for (const socket of sockets) {
        socket.end();
      }
    },
    getServerPort: ({ server }) => {
      const address = server.address();
      if (typeof address === "string") {
        return address;
      }
      const { port } = address;
      return port;
    },
    asyncServerTermination: ({ termination }) => termination,
  };
};
