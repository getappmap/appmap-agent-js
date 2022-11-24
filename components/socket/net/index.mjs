const { process, setInterval, clearInterval } = globalThis;

import { connect } from "net";
import { Buffer } from "buffer";
import NetSocketMessaging from "net-socket-messaging";
import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";
import { mapMaybe } from "../../util/index.mjs";
import { logWarningWhen, logWarning } from "../../log/index.mjs";

const { concat: concatBuffer } = Buffer;
const { createMessage } = NetSocketMessaging;

const flush = (socket, messages) => {
  if (socket.writable && messages.length > 0) {
    const buffers = messages.map(createMessage);
    // Socket.write registers asynchronous resources hence synchronous
    // message writing so we need to empty the messages array before
    messages.length = 0;
    socket.write(concatBuffer(buffers));
  }
};

export const openSocket = (host, port, { heartbeat, threshold }) => {
  const socket =
    typeof port === "string"
      ? connect(toIpcPath(convertFileUrlToPath(port)))
      : connect(port, host);
  socket.unref();
  const messages = [];
  socket.on("connect", () => {
    const flushBind = () => {
      flush(socket, messages);
    };
    process.once("beforeExit", flushBind);
    flushBind();
    const timer = mapMaybe(heartbeat, () => setInterval(flushBind, heartbeat));
    mapMaybe(timer, (timer) => {
      timer.unref();
    });
    socket.on("close", () => {
      process.off("beforeExit", flushBind);
      logWarningWhen(messages.length > 0, "Lost messages >> %j", messages);
      messages.length = 0;
      clearInterval(timer);
    });
  });
  return { messages, socket, threshold };
};

export const closeSocket = ({ socket, messages }) => {
  // TODO: investigate how to make this flush is done synchronously
  // because closeSocket is often called on process exit event.
  flush(socket, messages);
  socket.end();
};

export const sendSocket = ({ socket, messages, threshold }, message) => {
  if (socket.destroyed) {
    logWarning("Lost message >> %s", message);
  } else {
    messages.push(message);
    if (threshold !== null && messages.length > threshold) {
      flush(socket, messages);
    }
  }
};
