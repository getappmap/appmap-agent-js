import { connect } from "net";
import { createMessage } from "net-socket-messaging";
import { writeSync } from "fs";

const { stringify } = JSON;

export default (dependencies) => {
  function flushBuffer() {
    const {
      _handle: { fd },
    } = this;
    // assert(fd > 0, "invalid socket fd after connect");
    for (const buffer of this._appmap_buffer) {
      writeSync(fd, buffer);
    }
    this._appmap_buffer = null;
  }
  return {
    createClient: ({ host, port }) => {
      const socket = connect(
        ...(typeof port === "string" ? [port] : [port, host]),
      );
      socket._appmap_buffer = [];
      socket.on("connect", flushBuffer);
      return socket;
    },
    executeClientAsync: async (socket) => {
      socket.unref();
      try {
        await new Promise((resolve, reject) => {
          socket.on("close", resolve);
          socket.on("error", reject);
        });
      } finally {
        socket.destroy();
      }
    },
    interruptClient: (socket) => {
      socket.end();
    },
    sendClient: (socket, data) => {
      if (data !== null) {
        const buffer = createMessage(stringify(data));
        if (socket._appmap_buffer === null) {
          const {
            _handle: { fd },
          } = socket;
          writeSync(fd, buffer);
        } else {
          socket._appmap_buffer.push(buffer);
        }
      }
    },
  };
};
