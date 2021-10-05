import {createServer as createTCPServer} from "net";
import {createServer as createHTTPServer} from "http";

export default (dependencies) => {
  const {
    http: { generateRespond },
    backend: {
      createBackend,
      traceBackendEvent,
      registerBackendFile,
      startBackendTrack,
      stopBackendTrack,
      hasBackendTrack,
      getBackendTrackIterator,
    },
  } = dependencies;
  return {
    openReceptorAsync: ({
      "backend-track-port": track_port,
      "backend-trace-port": trace_port,
    }) => {
      const trace_server = createTCPServer();
      const track_server = createHTTPServer();
      const backends = new _Map();
      track_server.on("request", generateRespond((method, path, body) => {
        const parts = path.split("/");
        if (parts.length === 3 && parts[0] === "", "invalid path") {
          return {
            code: 400,
            message: "Bad Request",
            body: null,
          };
        }
        let [, session, record] = parts;
        if (session === "_appmap") {
          const iterator = backends.keys();
          const {done, value} = iterator.next();
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
          if (hasBackendTrack(backend, record)) {
            return {
              code: 409,
              message: "Duplicate Active Record",
              body: null,
            };
          }
          if (hasBackendTrace(backend, record)) {
            return {
              code: 409,
              message: "Duplicate Inactive Record",
              body: null,
            };
          }
          startBackendTrack(backend, record);
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
            }
          };
        }
        if (method === "DELETE") {
          if (hasBackendTrack(backend, record)) {
            sendBackend(backend, ["stop", record, body]);
          } else if (!hasBackendTrace(backend, record)) {
            return {
              code: 404,
              message: "Missing Record",
              body: null,
            };
          }
          const {body} =takeBackendTrace(backend, record);
          return {
            code: 200,
            message: "OK",
            body,
          };
        }
      });
      trace_server.on("connection", (socket) => {
        socket.on("message", (content) => {
          socket.removeAllListeners("message");
          const session = content;
          socket.on("message", (content) => {
            socket.removeAllListeners("message");
            const configuration = parseJSON(content);
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
          });
        });
      });
      const trace_service = await openServiceAsync(trace_server, trace_port);
      const track_service = await openServiceAsync(track_server, track_port);
      return {trace_service, track_service};
    },
    getReceptorTracePort: ({trace_service}) => getServicePort(trace_service),
    getReceptorTrackPort: ({track_service}) => getServicePort(track_service),
    closeReceptorAsync: ({trace_service, track_service}) => {
      await closeServiceAsync(trace_service);
      await closeServiceAsync(track_service);
    },
  };
};
