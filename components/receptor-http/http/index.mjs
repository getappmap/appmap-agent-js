import { createServer as createTCPServer } from "net";
import { createServer as createHTTPServer } from "http";
import { patch } from "net-socket-messaging";

const _Map = Map;
const { parse: parseJSON } = JSON;

export default (dependencies) => {
  const {
    util: { assert },
    http: { generateRespond },
    log: { logInfo, logError },
    service: { openServiceAsync, closeServiceAsync, getServicePort },
    backend: {
      createBackend,
      sendBackend,
      hasBackendTrace,
      hasBackendTrack,
      getBackendTrackIterator,
      takeBackendTrace,
    },
    configuration: { extendConfiguration },
  } = dependencies;
  const disconnection = {
    status: 1,
    errors: [
      {
        name: "AppmapError",
        message: "disconnection",
        stack: "",
      },
    ],
  };
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
      const backends = new _Map();
      track_server.on(
        "request",
        generateRespond(async (method, path, body) => {
          logInfo("Received remote recording request: %s %s", method, path);
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
            sendBackend(backend, [
              "start",
              record,
              { path: null, data: {}, ...body },
            ]);
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
              sendBackend(backend, [
                "stop",
                record,
                { status: 0, errors: [], ...body },
              ]);
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
        }),
      );
      trace_server.on("connection", (socket) => {
        patch(socket);
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
                  sendBackend(backend, ["stop", key, disconnection]);
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
      logInfo("Trace port: %j", getServicePort(trace_service));
      logInfo("Track port: %j", getServicePort(track_service));
      return { trace_service, track_service };
    },
    adaptReceptorConfiguration: (
      { trace_service, track_service },
      configuration,
    ) =>
      extendConfiguration(
        configuration,
        {
          "trace-port": getServicePort(trace_service),
          "track-port": getServicePort(track_service),
        },
        null,
      ),
    closeReceptorAsync: async ({ trace_service, track_service }) => {
      await closeServiceAsync(trace_service);
      await closeServiceAsync(track_service);
    },
  };
};
