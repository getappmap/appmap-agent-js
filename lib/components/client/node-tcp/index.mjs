import * as Net from "net";
import * as NetSocketMessaging from "net-socket-messaging";
import { bind, throwError, convertExpectError } from ("../../../util.mjs");

const global_JSON_stringify = JSON.stringify;

export default = ({}, options) => new Promise((resolve, reject) => {
  options = {
    host: "localhost",
    port: null,
    ... options,
  };
  expect(options.port !== null, "port is required for connection");
  const socket = new Net.Socket({
    allowHalfOpen: true
  });
  socket.connect(... typeof options.port === "string" ? [options.port] : [options.port, options.host]);
  socket.on("error", bind(reject, convertExpect("connection failure %o >> %s", options)));
  socket.unref();
  NetSocketMessaging.patch(socket);
  socket.on("connection", () => {
    socket.removeAllListeners("error");
    socket.on("error", bind(throwError, convertExpectError("connection lost %o >> %s", options)));
    resolve({
      send: (data) => {
        socket.send(global_JSON_stringify(data));
      },
      close: () => {
        socket.end();
      }
    });
  });
});
