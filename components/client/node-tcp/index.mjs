import { connect } from "net";
import { createMessage } from "net-socket-messaging";
import { writeSync } from "fs";

const _Promise = Promise;
const { stringify } = JSON;

export default (dependencies) => {
  const {
    util: { assert },
    uuid: { getUUID },
    request: {
      requestAsync,
      openResponder,
      listenResponderAsync,
      promiseResponderTermination,
      closeResponder,
    },
  } = dependencies;
  return {
    openClient: ({
      host,
      "trace-port": trace_port,
      "track-port": track_port,
      "local-track-port": local_track_port,
    }) => {
      const socket = connect(
        ...(typeof trace_port === "string" ? [trace_port] : [trace_port, host]),
      );
      const session = createMessage(getUUID());
      const buffer = [session];
      const responder = openResponder((method, path, body) =>
        requestAsync(host, track_port, method, `/${session}${path}`, body),
      );
      socket.on("connect", () => {
        socket.unref();
        const {
          _handle: { fd },
        } = socket;
        assert(fd > 0, "invalid socket fd after connect");
        for (const message of buffer) {
          writeSync(fd, message);
        }
        buffer.length = 0;
      });
      return {
        socket,
        responder,
        termination: new _Promise((resolve, reject) => {
          socket.on("error", reject);
          socket.on("close", resolve);
        }),
        buffer,
        session,
        host,
        trace_port,
        track_port,
        local_track_port,
      };
    },
    listenClientAsync: async ({ local_track_port, responder }) => {
      if (local_track_port !== null) {
        await listenResponderAsync(responder, local_track_port);
      }
    },
    promiseClientTermination: async ({ termination, responder }) => {
      await termination;
      await promiseResponderTermination(responder);
    },
    closeClient: ({ responder, socket }) => {
      closeResponder(responder);
      socket.end();
    },
    traceClient: ({ socket, buffer }, data) => {
      if (data !== null) {
        const message = createMessage(stringify(data));
        if (buffer.length === 0) {
          const {
            _handle: { fd },
          } = socket;
          writeSync(fd, message);
        } else {
          buffer.push(message);
        }
      }
    },
    /* c8 ignore start */
    trackClientAsync: async (
      { host, track_port, session },
      method,
      path,
      body,
    ) => requestAsync(host, track_port, method, `/${session}${path}`, body),
    /* c8 ignore stop */
  };
};
