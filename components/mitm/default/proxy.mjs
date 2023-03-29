import { Socket as NetSocket } from "node:net";
import { platform } from "node:process";
import { createServer as createHttpServer } from "node:http";
import { tmpdir } from "node:os";
import { addPool } from "../../pool/index.mjs";
import { logDebug, logWarning } from "../../log/index.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import {
  partialx_,
  partialx__,
  partialx___,
  toSocketAddress,
  parseHost,
} from "./util.mjs";

const HEAD = [
  "HTTP/1.1 200 Connection Established",
  "Proxy-agent: AppmapProxy",
  "",
  "",
].join("\r\n");

const getFreshPort = () => {
  /* c8 ignore start */
  if (platform === "win32") {
    return 0;
  } else {
    return `${tmpdir()}/${getUuid()}}`;
  }
  /* c8 ignore stop */
};

const forge = (servers, pool, host_string, handlers) => {
  if (servers.has(host_string)) {
    return servers.get(host_string);
  } else {
    const host = parseHost(host_string);
    const server = createHttpServer();
    server.on("connection", partialx_(addPool, pool));
    server.on("request", partialx__(handlers.request, host));
    server.on("upgrade", partialx___(handlers.upgrade, host));
    server.on("connect", partialx___(handlers.connect, host));
    server.listen(getFreshPort());
    servers.set(host_string, server);
    return server;
  }
};

export const requestProxy = (request, req, res) => {
  request(parseHost(req.headers.host), req, res);
};

export const upgradeProxy = (upgrade, req, socket, head) => {
  upgrade(parseHost(req.headers.host), req, socket, head);
};

const connect = (server, req, socket, head) => {
  const forward_socket = new NetSocket();
  /* c8 ignore start */
  forward_socket.on("error", () => {
    socket.destroy();
  });
  socket.on("error", () => {
    forward_socket.destroy();
  });
  forward_socket.on("error", (error) => {
    logWarning(
      "error on forward proxy socket >> %s %s %j >> %o",
      req.method,
      req.url,
      req.headers,
      error,
    );
  });
  /* c8 ignore stop */
  forward_socket.connect(toSocketAddress(server.address()));
  forward_socket.on("connect", () => {
    socket.write(HEAD);
    forward_socket.write(head);
    socket.pipe(forward_socket);
    forward_socket.pipe(socket);
  });
};

export const connectProxy = (handlers, servers, pool, req, socket, head) => {
  logDebug("proxy CONNECT %s %j", req.url, req.headers);
  /* c8 ignore start */
  socket.on("error", (error) => {
    logWarning(
      "error on proxy socket >> %s %s %j >> %o",
      req.method,
      req.url,
      req.headers,
      error,
    );
  });
  /* c8 ignore stop */
  const { url: host_string } = req;
  const server = forge(servers, pool, host_string, handlers);
  /* c8 ignore start */
  if (server.listening) {
    connect(server, req, socket, head);
  } else {
    server.on("listening", () => {
      connect(server, req, socket, head);
    });
  }
  /* c8 ignore stop */
};
