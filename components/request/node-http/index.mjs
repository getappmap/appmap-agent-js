import { createServer, request } from "http";

const { from: toBuffer } = Buffer;
const _Promise = Promise;
const _Set = Set;
const _setTimeout = setTimeout;
const { parse: parseJSON, stringify: stringifyJSON } = JSON;

const parse = (body) => {
  if (body === "") {
    return null;
  }
  return parseJSON(body);
};

const stringify = (data) => {
  if (data === null) {
    return "";
  }
  return stringifyJSON(data);
};

export default (dependencies) => {
  return {
    openServer: (respond) => {
      const server = createServer();
      server.unref();
      const sockets = new _Set();
      server.on("request", (readable, writable) => {
        const { method, url: path } = readable;
        readable.setEncoding("utf8");
        let body1 = "";
        readable.on("data", (chunk) => {
          body1 += chunk;
        });
        readable.on("end", () => {
          const {
            code,
            message,
            body: data2,
          } = respond(method, path, parse(body1));
          const buffer = toBuffer(stringify(data2), "utf8");
          writable.writeHead(code, message, {
            "content-length": buffer.length,
          });
          writable.end(buffer);
        });
      });
      server.on("connection", (socket) => {
        sockets.add(socket);
        /* c8 ignore start */
        socket.on("error", (error) => {
          server.emit("error", error);
          socket.destroy();
        });
        /* c8 ignore stop */
        socket.on("close", () => {
          sockets.delete(socket);
        });
      });
      return {
        server,
        sockets,
        termination: new _Promise((resolve, reject) => {
          server.on("error", reject);
          server.on("close", resolve);
        }),
      };
    },
    getServerPort: ({ server }) => {
      const address = server.address();
      if (typeof address === "string") {
        return address;
      }
      const { port } = address;
      return port;
    },
    listenAsync: ({ server }, port) =>
      new _Promise((resolve, reject) => {
        server.listen(port);
        server.on("error", reject);
        server.on("listening", resolve);
      }),
    promiseServerTermination: ({ termination }) => termination,
    closeServer: ({ server, sockets }) => {
      server.close();
      for (const socket of sockets) {
        socket.end();
      }
      _setTimeout(() => {
        /* c8 ignore start */
        for (const socket of sockets) {
          socket.destroy();
        }
        /* c8 ignore stop */
      }, 1000);
    },
    requestAsync: (host, port, method, path, data) =>
      new Promise((resolve, reject) => {
        const buffer = toBuffer(stringify(data), "utf8");
        const writable = request({
          host,
          port: typeof port === "number" ? port : null,
          socketPath: typeof port === "string" ? port : null,
          method,
          path,
          headers: {
            "content-length": buffer.length,
          },
        });
        writable.on("error", reject);
        writable.on("response", (readable) => {
          readable.setEncoding("utf8");
          readable.on("error", reject);
          let body = "";
          readable.on("data", (chunk) => {
            body += chunk;
          });
          readable.on("end", () => {
            resolve({
              code: readable.statusCode,
              message: readable.statusMessage,
              body: parse(body),
            });
          });
        });
        writable.end(buffer);
      }),
  };
};
