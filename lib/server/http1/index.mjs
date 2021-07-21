import { createServer } from "http";
import { hasOwnProperty, logError } from "../../../util/index.mjs";

const global_Promise = Promise;
const global_JSON_parse = JSON.parse;

/* c8 ignore start */

const onRequestError = (error) => {
  logError("http1 request error >> %e", error);
};

const onResponseError = (error) => {
  logError("http1 response error >> %e", error);
};

/* c8 ignore stop */

export default ({ Backend: {initializeBackend, terminateBackend, sendBackend, awaitBackendTermination} }, { port }) => ({
  initializeAsync: () => {
    const server = createServer();
    const backends = new Map();
    const sockets = new Set();
    server.on("connection", (socket) => {
      sockets.add(socket);
      socket.on("close", () => {
        sockets.delete(socket);
      });
    });
    server.on('error', () => {
      server.close();
      for (const socket of sockets) {
        socket.destroy();
      }
    });
    server.on("request", (request, response) => {
      const parts = [];
      response.on("error", onResponseError);
      request.on("error", onRequestError);
      request.setEncoding("utf8");
      request.on("data", (data) => {
        parts.push(data);
      });
      request.on("end", () => {
        const { head, body } = global_JSON_parse(parts.join(""));
        let backend = backends.get(head);
        if (backend === null) {
          response.writeHead(400, "terminated backend session");
        } else if (backend === global_undefined) {
          backend = initializeBackend();
          backends.set(head, backend);
          backend.awaitBackendTermination().catch((error) => {
            logError("backend error >> %e", error);
          }).finally(() => {
            backends.set(head, null);
          });
        }
        sendBackend(backend, body);
        response.end();
      });
    });
    return new global_Promise((resolve, reject) => {
      server.on("error", reject);
      server.on("listening", () => ({
        server,
        sockets,
        backends,
        termination: new global_Promise((resolve, reject) => {
          server.on("error", reject);
          server.on("close", resolve);
        }),
      }));
    });
  },
  terminateServer: ({server, sockets, sessions}) => {
    server.close();
    for (const socket of sockets) {
      if (
        hasOwnProperty(socket, "_httpMessage") &&
        socket._httpMessage
      ) {
        socket._httpMessage.on("finish", () => {
          socket.end();
        });
        /* c8 ignore start */
      } else {
        socket.end();
      }
      /* c8 ignore stop */
    }
    for (const backend of backends.values()) {
      terminateBackend(backend);
    }
  },
});
