import { tmpdir as getTemporaryDirectory } from "os";
import { pathToFileURL, fileURLToPath } from "url";

const { Promise, Set, setTimeout } = globalThis;

export default (dependencies) => {
  const {
    log: { logWarning },
    url: { appendURLSegment },
    path: { toIPCPath, fromIPCPath },
    uuid: { getUUID },
  } = dependencies;
  return {
    openServiceAsync: (server, port) => {
      const sockets = new Set();
      server.on("connection", (socket) => {
        sockets.add(socket);
        /* c8 ignore start */
        socket.on("error", (error) => {
          logWarning("Socket error >> %O", error);
        });
        /* c8 ignore stop */
        socket.on("close", () => {
          sockets.delete(socket);
        });
      });
      return new Promise((resolve, reject) => {
        server.on("error", reject);
        server.on("listening", () => {
          server.removeListener("error", reject);
          resolve({ server, sockets });
        });
        if (port === "") {
          port = appendURLSegment(
            pathToFileURL(getTemporaryDirectory()),
            getUUID(),
          );
        }
        server.listen(
          typeof port === "string" ? toIPCPath(fileURLToPath(port)) : port,
        );
      });
    },
    getServicePort: ({ server }) => {
      const address = server.address();
      return typeof address === "string"
        ? pathToFileURL(fromIPCPath(address)).toString()
        : address.port;
    },
    closeServiceAsync: ({ server, sockets }) =>
      new Promise((resolve, reject) => {
        server.on("error", reject);
        server.on("close", resolve);
        server.close();
        for (const socket of sockets) {
          socket.end();
        }
        setTimeout(() => {
          /* c8 ignore start */
          for (const socket of sockets) {
            logWarning("Socket failed to gracefully shutdown");
            socket.destroy();
          }
          /* c8 ignore stop */
        }, 1000);
      }),
  };
};
