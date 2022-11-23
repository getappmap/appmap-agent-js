const {
  URL,
  Error,
  Map,
  JSON: { parse: parseJSON },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import { createServer as createTCPServer } from "net";
import { readFileSync as readFile } from "fs";
import { createServer as createHTTPServer } from "http";
import NetSocketMessaging from "net-socket-messaging";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert, coalesce } from "../../util/index.mjs";
import { generateRespond } from "../../http/index.mjs";
import { logDebug, logError, logWarning } from "../../log/index.mjs";
import {
  openServiceAsync,
  closeServiceAsync,
  getServicePort,
} from "../../service/index.mjs";
import {
  createBackend,
  sendBackend,
  hasBackendTrace,
  hasBackendTrack,
  takeBackendTrace,
} from "../../backend/index.mjs";
import { extendConfigurationPort } from "../../configuration-accessor/index.mjs";

const { patch: patchSocket } = NetSocketMessaging;

export const minifyReceptorConfiguration = ({
  recorder,
  "trace-port": trace_port,
  "track-port": track_port,
}) => ({
  recorder,
  "trace-port": trace_port,
  "track-port": track_port,
});

export const openReceptorAsync = async ({
  recorder,
  "track-port": track_port,
  "trace-port": trace_port,
}) => {
  assert(
    recorder === "remote",
    "invalid recorder for receptor-http",
    InternalAppmapError,
  );
  const trace_server = createTCPServer();
  const track_server = createHTTPServer();
  const backends = new Map();
  track_server.on(
    "request",
    generateRespond((method, path, body) => {
      logDebug("Received remote recording request: %s %s", method, path);
      const parts = path.split("/");
      if (parts.length !== 3 || parts[0] !== "") {
        return {
          code: 400,
          message: "Bad Request",
          body: null,
        };
      }
      let [, session, record] = parts;
      if (session === "_appmap") {
        const iterator = backends.keys();
        const { done, value } = iterator.next();
        if (done) {
          return {
            code: 404,
            message: "No Active Session",
            body: null,
          };
        }
        session = value;
      } else if (!backends.has(session)) {
        return {
          code: 404,
          message: "Missing Session",
          body: null,
        };
      }
      const backend = backends.get(session);
      if (method === "POST") {
        if (
          hasBackendTrack(backend, record) ||
          hasBackendTrace(backend, record)
        ) {
          return {
            code: 409,
            message: "Duplicate Track",
            body: null,
          };
        }
        sendBackend(backend, {
          type: "start",
          track: record,
          configuration: coalesce(body, "data", {}),
          url: coalesce(body, "path", null),
        });
        return {
          code: 200,
          message: "OK",
          body: null,
        };
      }
      if (method === "GET") {
        return {
          code: 200,
          message: "OK",
          body: {
            enabled: hasBackendTrack(backend, record),
          },
        };
      }
      if (method === "DELETE") {
        if (hasBackendTrack(backend, record)) {
          sendBackend(backend, {
            type: "stop",
            track: record,
            termination: { type: "manual" },
          });
        } else if (!hasBackendTrace(backend, record)) {
          return {
            code: 404,
            message: "Missing Track",
            body: null,
          };
        }
        const { body: trace } = takeBackendTrace(backend, record);
        return {
          code: 200,
          message: "OK",
          body: trace,
        };
      }
      /* c8 ignore start */
      throw new Error("invalid http method");
      /* c8 ignore stop */
    }),
  );
  trace_server.on("connection", (socket) => {
    patchSocket(socket);
    socket.on("message", (session) => {
      socket.removeAllListeners("message");
      socket.on("message", (content) => {
        socket.removeAllListeners("message");
        const configuration = parseJSON(content);
        const { recorder } = configuration;
        if (recorder !== "remote") {
          logError(
            "Http receptor expected remote recorder but got: %j",
            recorder,
          );
          socket.destroy();
        } else {
          const backend = createBackend(configuration);
          backends.set(session, backend);
          socket.on("close", () => {
            sendBackend(backend, {
              type: "stop",
              track: null,
              termination: {
                type: "disconnect",
              },
            });
          });
          socket.on("message", (content) => {
            const message = parseJSON(content);
            if (message.type === "source" && message.content === null) {
              try {
                message.content = readFile(new URL(message.url), "utf8");
              } catch (error) {
                logWarning(
                  "Could not load source file %j >> %O",
                  message.url,
                  error,
                );
              }
            }
            sendBackend(backend, message);
          });
        }
      });
    });
  });
  const trace_service = await openServiceAsync(trace_server, trace_port);
  const track_service = await openServiceAsync(track_server, track_port);
  logDebug("Trace port: %j", getServicePort(trace_service));
  logDebug("Track port: %j", getServicePort(track_service));
  return { trace_service, track_service };
};

export const adaptReceptorConfiguration = (
  { trace_service, track_service },
  configuration,
) =>
  extendConfigurationPort(configuration, {
    "trace-port": getServicePort(trace_service),
    "track-port": getServicePort(track_service),
  });

export const closeReceptorAsync = async ({ trace_service, track_service }) => {
  await closeServiceAsync(trace_service);
  await closeServiceAsync(track_service);
};
