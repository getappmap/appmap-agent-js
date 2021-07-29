import { Socket } from "net";
import { patch } from "net-socket-messaging";

const { stringify } = JSON;

export default (dependencies) => {
  return {
    createClient: () => new Socket(),
    executeClientAsync: async (socket, { host, port }) => {
      socket.connect(...(typeof port === "string" ? [port] : [port, host]));
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
      socket.send(stringify(data));
    },
  };
};
