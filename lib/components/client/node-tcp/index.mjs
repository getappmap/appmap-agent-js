import * as Net from "net";
import * as NetSocketMessaging from "net-socket-messaging";
import { bind, throwError, convertExpectError } from ("../../../util.mjs");
import { checkOptions } from "../check-options.mjs";

const global_JSON_stringify = JSON.stringify;

const onSocketError = expectDeadcode("tcp socket error >> %e");

export default = ({}, options) => {
  const {host, port} = checkOptions(options);
  return {
    open: () => {
      const socket = new Net.Socket({
        allowHalfOpen: true
      });
      socket.connect(... typeof options.port === "string" ? [options.port] : [options.port, options.host]);
      socket.on("error", onSocketError);
      socket.unref();
      NetSocketMessaging.patch(socket);
      return socket;
    },
    send: (socket, data) => {
      socket.send(global_JSON_stringify(data));
    },
    close: (socket) => {
      socket.end();
    }
  }

    return {
      send: (data) => {
        socket.send(global_JSON_stringify(data));
      },
      close: () => {
        socket.end();
      }
    }
  };
};
