const { URL, Promise, Set, setTimeout } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { tmpdir as getTemporaryDirectory } from "os";
import { pathToFileURL, fileURLToPath } from "url";
const { logWarning } = await import(`../../log/index.mjs${__search}`);
const { appendURLSegment } = await import(`../../url/index.mjs${__search}`);
const { toIPCPath, fromIPCPath } = await import(
  `../../path/index.mjs${__search}`
);
const { getUUID } = await import(`../../uuid/index.mjs${__search}`);

export const openServiceAsync = (server, port) => {
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
};

export const getServicePort = ({ server }) => {
  const address = server.address();
  return typeof address === "string"
    ? pathToFileURL(fromIPCPath(address)).toString()
    : address.port;
};

export const closeServiceAsync = ({ server, sockets }) =>
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
  });
