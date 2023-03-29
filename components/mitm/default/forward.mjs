import { Buffer } from "node:buffer";
import { Socket as NetSocket } from "node:net";
import { request as requestHttp } from "node:http";
import { logWarning } from "../../log/index.mjs";

const { from: toBuffer } = Buffer;

export const forwardRequest = (host, inc_req, callback) => {
  let done = false;
  /* c8 ignore start */
  inc_req.on("error", (error) => {
    if (!done) {
      done = true;
      callback(error, null);
    }
  });
  /* c8 ignore stop */
  const out_req = requestHttp({
    host: host.name,
    port: host.port,
    method: inc_req.method,
    path: inc_req.url,
    headers: inc_req.headers,
  });
  /* c8 ignore start */
  out_req.on("error", (error) => {
    if (!done) {
      done = true;
      callback(error, null);
    }
  });
  /* c8 ignore stop */
  out_req.on("response", (res) => {
    if (!done) {
      done = true;
      callback(null, res);
    }
  });
  inc_req.pipe(out_req);
};

export const forwardResponse = (inc_res, out_res) => {
  out_res.writeHead(inc_res.statusCode, inc_res.statusMessage, inc_res.headers);
  inc_res.pipe(out_res);
};

const stringifyHead = ({
  method,
  url,
  httpVersion: version,
  rawHeaders: headers,
}) => {
  const chunks = [];
  chunks.push(`${method} ${url} HTTP/${version}`);
  for (let index = 0; index < headers.length; index += 2) {
    chunks.push(`${headers[index]}: ${headers[index + 1]}`);
  }
  chunks.push("");
  chunks.push("");
  return chunks.join("\r\n");
};

const forwardSpecial = (host, req, socket, head) => {
  const forward_socket = new NetSocket();
  /* c8 ignore start */
  socket.on("error", (error) => {
    logWarning(
      "error on socket %j >> %s %s %j >> %o",
      host,
      req.method,
      req.url,
      req.headers,
      error,
    );
    forward_socket.destroy();
  });
  forward_socket.on("error", (error) => {
    logWarning(
      "error on forward socket %j >> %s %s %j >> %o",
      host,
      req.method,
      req.url,
      req.headers,
      error,
    );
    socket.destroy();
  });
  /* c8 ignore stop */
  forward_socket.connect(host.port, host.name);
  forward_socket.on("connect", () => {
    forward_socket.write(toBuffer(stringifyHead(req), "utf8"));
    forward_socket.write(head);
    socket.pipe(forward_socket);
    forward_socket.pipe(socket);
  });
};

export const forwardUpgrade = forwardSpecial;

export const forwardConnect = forwardSpecial;
