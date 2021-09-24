import { createServer, request as createRequest } from "http";

const { from: toBuffer, concat: concatBuffer } = Buffer;
const _Promise = Promise;
const _Set = Set;
const _setTimeout = setTimeout;
const { parse: parseJSON, stringify: stringifyJSON } = JSON;

const INVALID_HEADERS_MESSAGE =
  "in the presence of a body, 'content-type' should be 'application/json; charset=UTF-8'";

export default (dependencies) => {
  const {
    util: { noop, hasOwnProperty },
  } = dependencies;
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
  const areValidHeaders = (headers) =>
    !hasOwnProperty(headers, "content-length") ||
    headers["content-length"] === "0" ||
    (hasOwnProperty(headers, "content-type") &&
      headers["content-type"] === "application/json; charset=UTF-8");
  const empty_headers = {
    "content-length": 0,
  };
  const createHeaders = ({ length }) => {
    if (length === 0) {
      return empty_headers;
    }
    return {
      "content-type": "application/json; charset=UTF-8",
      "content-length": length,
    };
  };
  const serve = (respondAsync, request, response) => {
    if (areValidHeaders(request.headers)) {
      let buffers = [];
      request.on("data", (buffer) => {
        buffers.push(buffer);
      });
      request.on("end", async () => {
        let code,
          message,
          body = parse(concatBuffer(buffers).toString("utf8"));
        try {
          ({ code, message, body } = await respondAsync(
            request.method,
            request.url,
            body,
          ));
        } catch (error) {
          code = 500;
          message = error.message;
          body = null;
        }
        const buffer = toBuffer(stringify(body), "utf8");
        response.writeHead(code, message, createHeaders(buffer));
        response.end(buffer);
      });
    } else {
      request.on("data", noop);
      request.on("end", noop);
      response.writeHead(400, INVALID_HEADERS_MESSAGE, empty_headers);
      response.end();
    }
  };
  const requestAsync = (host, port, method, path, data) =>
    new Promise((resolve, reject) => {
      const buffer = toBuffer(stringify(data), "utf8");
      const request = createRequest({
        host,
        port: typeof port === "number" ? port : null,
        socketPath: typeof port === "string" ? port : null,
        method,
        path,
        headers: createHeaders(buffer),
      });
      request.end(buffer);
      request.on("error", reject);
      request.on("response", (response) => {
        response.on("error", reject);
        if (areValidHeaders(response.headers)) {
          const buffers = [];
          response.on("data", (buffer) => {
            buffers.push(buffer);
          });
          response.on("end", () => {
            resolve({
              code: response.statusCode,
              message: response.statusMessage,
              body: parse(concatBuffer(buffers).toString("utf8")),
            });
          });
        } else {
          reject(new Error(INVALID_HEADERS_MESSAGE));
        }
      });
    });
  return {
    serve,
    requestAsync,
    openResponder: (respondAsync) => {
      const server = createServer();
      server.unref();
      const sockets = new _Set();
      server.on("request", (request, response) => {
        serve(respondAsync, request, response);
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
    getResponderPort: ({ server }) => {
      const address = server.address();
      if (typeof address === "string") {
        return address;
      }
      const { port } = address;
      return port;
    },
    listenResponderAsync: ({ server }, port) =>
      new _Promise((resolve, reject) => {
        server.listen(port);
        server.on("error", reject);
        server.on("listening", resolve);
      }),
    promiseResponderTermination: ({ termination }) => termination,
    closeResponder: ({ server, sockets }) => {
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
  };
};
