import { connect } from "net";
import { createMessage } from "net-socket-messaging";
import { writeSync } from "fs";

const _Promise = Promise;
const { stringify } = JSON;

export default (dependencies) => {
  const {
    uuid: { getUUID },
    util: { generateDeadcode },
    request: { requestAsync },
  } = dependencies;
  return {
    openClient: ({
      host,
      "trace-port": trace_port,
      "track-port": track_port,
    }) => {
      const socket = connect(
        ...(typeof trace_port === "string" ? [trace_port] : [trace_port, host]),
      );
      const session = createMessage(getUUID());
      const buffer = [session];
      socket.on("connect", () => {
        socket.unref();
        const {
          _handle: { fd },
        } = socket;
        // assert(fd > 0, "invalid socket fd after connect");
        for (const message of buffer) {
          writeSync(fd, message);
        }
        buffer.length = 0;
      });
      return {
        socket,
        termination: new _Promise((resolve, reject) => {
          socket.on("error", reject);
          socket.on("close", resolve);
        }),
        buffer,
        session,
        host,
        trace_port,
        track_port,
      };
    },
    promiseClientTermination: ({ termination }) => termination,
    closeClient: ({ socket }) => {
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
    trackClient: generateDeadcode(
      "pilotClientAsync should be used instead of pilotClient for non-inline client",
    ),
    trackClientAsync: async (
      { host, track_port, session },
      method,
      path,
      body,
    ) => requestAsync(host, track_port, method, `/${session}${path}`, body),
    /* c8 ignore stop */
  };
};
