import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";
import { logWarning } from "../../log/index.mjs";

const { Promise, undefined } = globalThis;

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
  createSocket: ({ host, "trace-port": port }) => {
    if (host === "localhost") {
      host = "127.0.0.1";
    }
    return {
      fd: createSocket(
        typeof port === "number" ? AF_INET : AF_UNIX,
        SOCK_STREAM,
        0,
      ),
      host,
      port,
      ready: { value: false },
    };
  },
  isSocketReady: ({ ready }) => ready.value,
  openSocketAsync: ({ fd, ready, host, port }) => {
    if (!ready.value) {
      connectSocket(
        fd,
        typeof port === "number"
          ? { sin_family: AF_INET, sin_port: port, sin_addr: host }
          : {
              sun_family: AF_UNIX,
              sun_path: toIpcPath(convertFileUrlToPath(port)),
            },
      );
      ready.value = true;
    }
    return Promise.resolve(undefined);
  },
  sendSocket: ({ fd, ready }, message) => {
    if (ready.value) {
      sendSocket(fd, message);
    } else {
      logWarning("Lost message >> %s", message);
    }
  },
  closeSocketAsync: ({ fd, ready }) => {
    if (ready.value) {
      closeSocket(fd);
      ready.value = false;
    }
    return Promise.resolve(undefined);
  },
});
