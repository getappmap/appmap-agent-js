import { connect } from "net";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";
import NetSocketMessaging from "net-socket-messaging";

const { concat: concatBuffer } = Buffer;
const { createMessage } = NetSocketMessaging;

export default (dependencies) => {
  const {
    path: { toIPCPath },
    log: { logGuardWarning, logWarning },
  } = dependencies;
  const flush = (socket, messages) => {
    if (socket.writable) {
      socket.write(concatBuffer(messages.map(createMessage)));
      messages.length = 0;
    }
  };
  return {
    openSocket: (host, port, { heartbeat, threshold }) => {
      const socket =
        typeof port === "string"
          ? connect(toIPCPath(fileURLToPath(port)))
          : connect(port, host);
      const messages = [];
      socket.on("connect", () => {
        flush(socket, messages);
        const timer = setInterval(flush, heartbeat, socket, messages);
        socket.on("close", () => {
          logGuardWarning(messages.length > 0, "Lost messages >> %j", messages);
          messages.length = 0;
          clearInterval(timer);
        });
      });
      return { messages, socket, threshold };
    },
    closeSocket: ({ socket }) => {
      socket.end();
    },
    sendSocket: ({ socket, messages, threshold }, message) => {
      if (socket.destroyed) {
        logWarning("Lost message >> %s", message);
      } else {
        messages.push(message);
        if (messages.length > threshold) {
          flush(socket, messages);
        }
      }
    },
  };
};
