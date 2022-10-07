const { URL, process, setInterval, clearInterval } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { connect } from "net";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";
import NetSocketMessaging from "net-socket-messaging";
const { toIPCPath } = await import(`../../path/index.mjs${__search}`);
const { mapMaybe } = await import(`../../util/index.mjs${__search}`);
const { logGuardWarning, logWarning } = await import(
  `../../log/index.mjs${__search}`
);

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
      ? connect(toIPCPath(fileURLToPath(port)))
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
      logGuardWarning(messages.length > 0, "Lost messages >> %j", messages);
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
