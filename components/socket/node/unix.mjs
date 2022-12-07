import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";

export const generateUnixSocket = (
  {
    AF_INET,
    AF_UNIX,
    SOCK_STREAM,
    socket: createSocket,
    connect: connectSocket,
    close: closeSocket,
  },
  { send: sendSocket },
) => ({
  closeSocket,
  sendSocket,
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
        : {
            sun_family: AF_UNIX,
            sun_path: toIpcPath(convertFileUrlToPath(port)),
          },
    );
    return fd;
  },
});
