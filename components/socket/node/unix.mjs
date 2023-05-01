/* c8 ignore start */

import {
  createEventTarget,
  addEventListener,
  removeEventListener,
  dispatchEvent,
} from "../../event/index.mjs";
import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";
import { logWarning } from "../../log/index.mjs";

const {
  ArrayBuffer,
  setInterval,
  clearInterval,
  setTimeout,
  setImmediate,
  undefined,
} = globalThis;

const PULL_INTERVAL = 1000;

const CLOSE_TIMEOUT = 1000;

const makeNoopSocket = (target) => ({
  fd: null,
  ready: { value: false },
  timer: null,
  target,
});

const EMPTY = new ArrayBuffer(1);

export const generateUnixSocket = (
  {
    AF_INET,
    AF_UNIX,
    SOCK_STREAM,
    MSG_DONTWAIT,
    MSG_PEEK,
    SHUT_WR,
    recv: recvSocket,
    socket: createSocket,
    connect: connectSocket,
    shutdown: shutdownSocket,
    close: closeSocket,
  },
  { send: sendMessage, receive: receiveMessage },
) => {
  const pull = (fd, target) => {
    const messages = [];
    while (true) {
      try {
        if (recvSocket(fd, EMPTY, 1, MSG_PEEK | MSG_DONTWAIT) === 0) {
          break;
        }
      } catch {
        break;
      }
      try {
        messages.push(receiveMessage(fd));
      } catch (error) {
        setImmediate(dispatchEvent, target, "error", error);
        return undefined;
      }
    }
    for (const message of messages) {
      dispatchEvent(target, "message", message);
    }
    return undefined;
  };
  return {
    openSocket: ({ host, "trace-port": port }) => {
      const target = createEventTarget();
      if (host === "localhost") {
        host = "127.0.0.1";
      }
      let fd = null;
      const family = typeof port === "number" ? AF_INET : AF_UNIX;
      try {
        fd = createSocket(family, SOCK_STREAM, 0);
      } catch (error) {
        setImmediate(dispatchEvent, target, "error", error);
        return makeNoopSocket(target);
      }
      const options =
        typeof port === "number"
          ? { sin_family: AF_INET, sin_port: port, sin_addr: host }
          : {
              sun_family: AF_UNIX,
              sun_path: toIpcPath(convertFileUrlToPath(port)),
            };
      try {
        connectSocket(fd, options);
      } catch (error) {
        setImmediate(dispatchEvent, target, "error", error);
        return makeNoopSocket(target);
      }
      setImmediate(dispatchEvent, target, "open", null);
      const timer = setInterval(pull, PULL_INTERVAL, fd, target);
      timer.unref();
      return {
        fd,
        ready: { value: true },
        timer,
        target,
      };
    },
    addSocketListener: ({ target }, name, listener) => {
      addEventListener(target, name, listener);
    },
    removeSocketListener: ({ target }, name, listener) => {
      removeEventListener(target, name, listener);
    },
    isSocketReady: ({ ready }) => ready.value,
    sendSocket: ({ fd, ready, target }, message) => {
      if (ready.value) {
        try {
          sendMessage(fd, message);
        } catch (error) {
          setImmediate(dispatchEvent, target, "error", error);
        }
      } else {
        logWarning("Lost message >> %s", message);
      }
    },
    closeSocket: ({ fd, ready, timer, target }) => {
      if (ready.value) {
        clearInterval(timer);
        ready.value = false;
        try {
          shutdownSocket(fd, SHUT_WR);
        } catch (error) {
          /* eslint-disable no-empty */
          try {
            closeSocket(fd);
          } catch {}
          /* eslint-enable no-empty */
          setImmediate(dispatchEvent, target, "error", error);
          return undefined;
        }
        setTimeout(() => {
          pull(fd, target);
          try {
            closeSocket(fd);
          } catch (error) {
            setImmediate(dispatchEvent, target, "error", error);
            return undefined;
          }
          setImmediate(dispatchEvent, target, "close", null);
          return undefined;
        }, CLOSE_TIMEOUT);
      }
      return undefined;
    },
  };
};
