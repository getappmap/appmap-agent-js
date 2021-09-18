import { createServer } from "net";
import { patch } from "net-socket-messaging";

const _Promise = Promise;
const _Set = Set;
const { parse: parseJSON } = JSON;

export default (dependencies) => {
  const {
    backend: { openBackend, sendBackend, closeBackend },
    expect: { expectSuccess },
    storage: { createStorage, store },
    log: { logError },
  } = dependencies;
  return {
    openServerAsync: (options) => {
      const { port } = { port: 0, ...options };
      const server = createServer();
      const sockets = new _Set();
      const storage = createStorage();
      server.on("error", (error) => {
        server.close();
        for (const socket of sockets) {
          socket.destroy();
        }
      });
      server.on("connection", (socket) => {
        patch(socket);
        const backend = openBackend();
        sockets.add(socket);
        socket.on("close", () => {
          sockets.delete(socket);
          for (const { configuration, data } of closeBackend(backend)) {
            store(storage, configuration, data);
          }
        });
        /* c8 ignore start */
        socket.on("error", (error) => {
          logError("tcp socket error >> %e", error);
          socket.destroy();
        });
        /* c8 ignore stop */
        socket.on("message", (data) => {
          const message = expectSuccess(
            () => parseJSON(data),
            "failed to parse JSON message %j >> %e",
            data,
          );
          for (const { configuration, data } of sendBackend(backend, message)) {
            store(storage, configuration, data);
          }
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
    promiseServerTermination: ({ termination }) => termination,
    closeServer: ({ server, sockets }) => {
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
  };
};
