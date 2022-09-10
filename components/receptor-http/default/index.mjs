import { createServer as createTCPServer } from "net";
import { createServer as createHTTPServer } from "http";
import NetSocketMessaging from "net-socket-messaging";

const { patch: patchSocket } = NetSocketMessaging;

const {
  Map,
  JSON: { parse: parseJSON },
} = globalThis;

export default (dependencies) => {
  const {
    util: { assert, coalesce },
    http: { generateRespond },
    log: { logDebug, logError },
    service: { openServiceAsync, closeServiceAsync, getServicePort },
    backend: {
      createBackend,
      sendBackend,
      hasBackendTrace,
      hasBackendTrack,
      getBackendTrackIterator,
      takeBackendTrace,
    },
    "configuration-accessor": { extendConfigurationPort },
  } = dependencies;
  return {
    minifyReceptorConfiguration: ({
      recorder,
      "trace-port": trace_port,
      "track-port": track_port,
    }) => ({
      recorder,
      "trace-port": trace_port,
      "track-port": track_port,
    }),
    openReceptorAsync: async ({
      recorder,
      "track-port": track_port,
      "trace-port": trace_port,
    }) => {
      assert(recorder === "remote", "invalid recorder for receptor-http");
      const trace_server = createTCPServer();
      const track_server = createHTTPServer();
      const backends = new Map();
      track_server.on(
        "request",
        generateRespond(async (method, path, body) => {
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
                status: coalesce(body, "status", 0),
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
          throw assert(false, "invalid http method");
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
                "Http receptor expected remote recorder but got: ",
                recorder,
              );
              socket.destroy();
            } else {
              const backend = createBackend(configuration);
              backends.set(session, backend);
              socket.on("close", () => {
                for (const key of getBackendTrackIterator(backend)) {
                  sendBackend(backend, {
                    type: "error",
                    name: "AppmapError",
                    message: "disconnection",
                    stack: "",
                  });
                  sendBackend(backend, {
                    type: "stop",
                    track: key,
                    status: 1,
                  });
                }
              });
              socket.on("message", (content) => {
                sendBackend(backend, parseJSON(content));
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
    },
    adaptReceptorConfiguration: (
      { trace_service, track_service },
      configuration,
    ) =>
      extendConfigurationPort(configuration, {
        "trace-port": getServicePort(trace_service),
        "track-port": getServicePort(track_service),
      }),
    closeReceptorAsync: async ({ trace_service, track_service }) => {
      await closeServiceAsync(trace_service);
      await closeServiceAsync(track_service);
    },
  };
};
