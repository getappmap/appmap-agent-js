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

export default ({ backend: { open } }, { port }) => ({
  openAsync: () =>
    new global_Promise((resolve, reject) => {
      const server = createServer();
      const sessions = new Map();
      const sockets = new Set();
      server.on("error", reject);
      server.on("connection", (socket) => {
        socket.on("close", () => {
          sockets.delete(socket);
        });
        sockets.add(socket);
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
          if (!sessions.has(head)) {
            sessions.set(head, open());
          }
          sessions.get(head).receive(body);
          response.end();
        });
      });
      server.on("listening", () => {
        resolve({
          server,
          life: new global_Promise((resolve, reject) => {
            server.on("error", (error) => {
              server.close();
              for (const socket of sockets) {
                socket.destroy();
              }
              for (const { close } of sessions.values()) {
                close();
              }
              reject(error);
            });
            server.on("close", resolve);
          }),
          close: () => {
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
            for (const { close } of sessions.values()) {
              close();
            }
          },
        });
      });
      server.listen(port);
    }),
});
