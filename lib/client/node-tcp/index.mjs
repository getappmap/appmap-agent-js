import { Socket } from "net";
import { patch } from "net-socket-messaging";

const { stringify: global_JSON_stringify } = JSON;

export default (dependencies) => {
  return {
    initializeClient: ({host, port}) => {
      const socket = new Socket();
      socket.connect(...(typeof port === "string" ? [port] : [port, host]));
      socket.unref();
      patch(socket);
      return {
        socket,
        termination: new Promise((resolve, reject) => {
          socket.on("close", resolve);
          socket.on("error", reject);
        }),
      };
    },
    terminateClient: ({ socket }) => socket.end(),
    sendClient: ({ socket }, data) => socket.send(global_JSON_stringify(data)),
    asyncClientTermination: ({ termination }) => termination,
  };
};
