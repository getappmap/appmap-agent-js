import { fileURLToPath } from "url";
// Dynamically import optional dependencies
import Module from "module";
const require = Module.createRequire(import.meta.url);

export default (dependencies) => {
  const {
    path: { toIPCPath },
  } = dependencies;
  const {
    AF_INET,
    AF_UNIX,
    SOCK_STREAM,
    socket: createSocket,
    connect: connectSocket,
    close: closeSocket,
  } = require("posix-socket");
  const { send: sendSocket } = require("posix-socket-messaging");
  return {
    openSocket: (host, port, _configuration) => {
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
    },
    closeSocket,
    sendSocket,
  };
};
