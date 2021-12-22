import { connect } from "net";
import { writeSync } from "fs";
import NetSocketMessaging from "net-socket-messaging";

const { createMessage } = NetSocketMessaging;

export default (dependencies) => {
  const {
    log: { logWarning },
  } = dependencies;
  const send = (socket, message) => {
    writeSync(socket._handle.fd, createMessage(message));
  };
  return {
    openSocket: (host, port) => {
      const socket =
        typeof port === "string" ? connect(port) : connect(port, host);
      const messages = [];
      socket.on("connect", () => {
        for (const message of messages) {
          send(socket, message);
        }
        messages.length = 0;
      });
      return { messages, socket };
    },
    closeSocket: ({ socket }) => {
      socket.end();
    },
    sendSocket: ({ socket, messages }, message) => {
      if (socket.readyState === "open" || socket.readyState === "readOnly") {
        send(socket, message);
      } else if (socket.readyState === "opening") {
        messages.push(message);
      } else {
        logWarning("Lost message >> %s", message);
      }
    },
  };
};
