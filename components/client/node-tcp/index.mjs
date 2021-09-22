import { connect } from "net";
import { createMessage } from "net-socket-messaging";
import { writeSync } from "fs";

const _Promise = Promise;
const { stringify } = JSON;

export default (dependencies) => {
  const {
    uuid: { getUUID },
    request: { requestAsync },
  } = dependencies;
  return {
    openClient: ({
      host,
      port,
      "remote-recording-port": remote_recording_port,
    }) => {
      const socket = connect(
        ...(typeof port === "string" ? [port] : [port, host]),
      );
      const buffer = [createMessage(getUUID())];
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
        host,
        port,
        remote_recording_port,
      };
    },
    promiseClientTermination: ({ termination }) => termination,
    closeClient: ({ socket }) => {
      socket.end();
    },
    sendClient: ({ socket, buffer }, data) => {
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
    requestClientAsync: async (
      { host, remote_recording_port },
      method,
      path,
      body,
    ) => requestAsync(host, remote_recording_port, method, path, body),
    /* c8 ignore stop */
  };
};
