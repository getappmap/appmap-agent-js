import { Socket } from "net";
import { patch } from "net-socket-messaging";

const { stringify: global_JSON_stringify } = JSON;

export default (dependencies) => {
  return {
    createClient: ({ host, port }) => {
      const socket = new Socket();
      socket.unref();
      patch(socket);
      return {
        host,
        port,
        socket,
        termination: new Promise((resolve, reject) => {
          socket.on("close", resolve);
          socket.on("error", reject);
        }),
      };
    },
    initializeClient: ({ socket, host, port }) => {
      socket.connect(...(typeof port === "string" ? [port] : [port, host]));
    },
    terminateClient: ({ socket }) => socket.end(),
    sendClient: ({ socket }, data) => socket.send(global_JSON_stringify(data)),
    asyncClientTermination: ({ termination }) => termination,
  };
};
