import { connect } from "net";
import { patch } from "net-socket-messaging";

const { stringify } = JSON;

export default (dependencies) => {
  return {
    createClient: ({ host, port }) =>
      connect(...(typeof port === "string" ? [port] : [port, host])),
    executeClientAsync: async (socket) => {
      socket.unref();
      patch(socket);
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
        socket.send(stringify(data));
      }
    },
  };
};
