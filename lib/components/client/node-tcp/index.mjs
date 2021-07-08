import { Socket } from "net";
import { patch } from "net-socket-messaging";
import { expectDeadcode } from "../../../util/index.mjs";

const global_JSON_stringify = JSON.stringify;

const onSocketError = expectDeadcode("tcp socket error >> %e");

export default (dependencies, { host, port }) => ({
  open: () => {
    const socket = new Socket({
      allowHalfOpen: true,
    });
    socket.connect(...(typeof port === "string" ? [port] : [port, host]));
    socket.on("error", onSocketError);
    socket.unref();
    patch(socket);
    return {
      send: (data) => {
        socket.send(global_JSON_stringify(data));
      },
      close: () => {
        socket.end();
      },
    };
  },
});
