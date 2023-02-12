import { readFileSync as readFile } from "node:fs";
import { createServer } from "node:net";
import NetSocketMessaging from "net-socket-messaging";
import { InternalAppmapError } from "../../error/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { assert } from "../../util/index.mjs";
import { sendBackend } from "../../backend/index.mjs";

const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

const { patch: patchSocket } = NetSocketMessaging;

const inflateMessage = (message) => {
  if (message.type === "source" && message.content === null) {
    try {
      return {
        ...message,
        content: readFile(new URL(message.url), "utf8"),
      };
    } catch (error) {
      logWarning("Could not load source file %j >> %O", message.url, error);
      return message;
    }
  } else {
    return message;
  }
};

export const createTraceServer = (backend) => {
  const server = createServer();
  server.on("connection", (socket) => {
    patchSocket(socket);
    socket.on("message", (content) => {
      assert(
        sendBackend(backend, inflateMessage(parseJSON(content))),
        "backend error",
        InternalAppmapError,
      );
    });
  });
  return server;
};
