import { Socket } from "net";
import { patch } from "net-socket-messaging";

const global_JSON_stringify = JSON.stringify;

export default (dependencies, { host, port }) => ({
  open: () => {
    const socket = new Socket();
    socket.connect(...(typeof port === "string" ? [port] : [port, host]));
    socket.unref();
    patch(socket);
    return {
      life: new Promise((resolve, reject) => {
        socket.on("error", (error) => {
          socket.destroy();
          reject(error);
        });
        socket.on("close", resolve);
      }),
      send: (data) => {
        socket.send(global_JSON_stringify(data));
      },
      close: () => {
        socket.end();
      },
    };
  },
});
