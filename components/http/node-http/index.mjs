const {
  Buffer: { from: toBuffer, concat: concatBuffer },
  Promise,
  Error,
  JSON: { parse: parseJSON, stringify: stringifyJSON },
} = globalThis;

import Http from "node:http";

import { noop, hasOwnProperty } from "../../util/index.mjs";
import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";

const { request: createRequest } = Http;

const INVALID_HEADERS_MESSAGE =
  "in the presence of a body, 'content-type' should be 'application/json; charset=UTF-8'";

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

export const requestAsync = (host, port, method, path, data) =>
  new Promise((resolve, reject) => {
    const buffer = toBuffer(stringify(data), "utf8");
    const request = createRequest({
      host,
      port: typeof port === "number" ? port : null,
      socketPath:
        typeof port === "string" ? toIpcPath(convertFileUrlToPath(port)) : null,
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

export const generateRespond = (respondAsync) => (request, response) => {
  if (areValidHeaders(request.headers)) {
    const buffers = [];
    request.on("data", (buffer) => {
      buffers.push(buffer);
    });
    request.on("end", async () => {
      const { code, message, body } = await respondAsync(
        request.method,
        request.url,
        parse(concatBuffer(buffers).toString("utf8")),
      );
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
