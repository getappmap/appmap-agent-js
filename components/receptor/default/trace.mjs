import { readFileSync as readFile } from "node:fs";
import { createServer } from "node:net";
import NetSocketMessaging from "net-socket-messaging";
import { InternalAppmapError } from "../../error/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { assert } from "../../util/index.mjs";
import { inflate } from "../../compress/index.mjs";
import {
  sendBackend,
  countBackendCompleteTrack,
} from "../../backend/index.mjs";

const {
  setInterval,
  clearInterval,
  String,
  Set,
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

const BACK_PRESSURE_INTERVAL = 1000;

const { patch: patchSocket } = NetSocketMessaging;

const readFileSafe = (url) => {
  try {
    return readFile(new URL(url), "utf8");
  } catch (error) {
    logWarning("Could not load source at %j >> %O", url, error);
    return null;
  }
};

const sendBackendAssert = (backend, message) => {
  assert(sendBackend(backend, message), "backend error", InternalAppmapError);
};

export const createTraceServer = (backend) => {
  const server = createServer();
  server.on("connection", (socket) => {
    patchSocket(socket);
    socket.send(String(countBackendCompleteTrack(backend)));
    /* c8 ignore start */
    const timer = setInterval(() => {
      if (socket.writable) {
        socket.send(String(countBackendCompleteTrack(backend)));
      }
    }, BACK_PRESSURE_INTERVAL);
    timer.unref();
    /* c8 ignore stop */
    const tracks = new Set();
    /* c8 ignore start */
    socket.on("error", (error) => {
      logWarning("Socket error: %O", error);
    });
    /* c8 ignore stop */
    socket.on("close", () => {
      clearInterval(timer);
      // Normally hook-exit send a stop-all message.
      // But this message may never arrive due to
      // underlying network/buffer issue.
      // This serves as fallback mechanism.
      for (const track of tracks) {
        sendBackendAssert(backend, {
          type: "stop",
          track,
          termination: {
            type: "disconnect",
          },
        });
      }
      tracks.clear();
    });
    socket.on("message", (content) => {
      for (const message of inflate(parseJSON(content))) {
        if (message.type === "start") {
          tracks.add(message.track);
          sendBackendAssert(backend, message);
        } else if (message.type === "stop") {
          if (message.track === null) {
            for (const track of tracks) {
              sendBackendAssert(backend, {
                type: "stop",
                track,
                termination: message.termination,
              });
            }
            tracks.clear();
          } else {
            tracks.delete(message.track);
            sendBackendAssert(backend, message);
          }
        } else if (message.type === "source" && message.content === null) {
          sendBackendAssert(backend, {
            ...message,
            content: readFileSafe(message.url),
          });
        } else {
          sendBackendAssert(backend, message);
        }
      }
    });
  });
  return server;
};
