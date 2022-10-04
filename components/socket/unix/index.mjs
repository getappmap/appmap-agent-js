const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { fileURLToPath } from "url";
// Dynamically import optional dependencies
import { createRequire } from "module";
const { toIPCPath } = await import(`../../path/index.mjs${__search}`);

const require = createRequire(import.meta.url);

const {
  AF_INET,
  AF_UNIX,
  SOCK_STREAM,
  socket: createSocket,
  connect: connectSocket,
} = require("posix-socket");

export const { close: closeSocket } = require("posix-socket");

export const { send: sendSocket } = require("posix-socket-messaging");

export const openSocket = (host, port, _configuration) => {
  const fd = createSocket(
    typeof port === "number" ? AF_INET : AF_UNIX,
    SOCK_STREAM,
    0,
  );
  connectSocket(
    fd,
    typeof port === "number"
      ? { sin_family: AF_INET, sin_port: port, sin_addr: host }
      : { sun_family: AF_UNIX, sun_path: toIPCPath(fileURLToPath(port)) },
  );
  return fd;
};
