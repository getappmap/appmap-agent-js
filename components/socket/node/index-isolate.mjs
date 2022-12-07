import { createRequire } from "node:module";
import { hasOwnProperty } from "../../util/index.mjs";
import * as NetSocket from "./net.mjs";
import { generateUnixSocket } from "./unix.mjs";

export const generateSocket = (env) => {
  if (hasOwnProperty(env, "APPMAP_SOCKET") && env.APPMAP_SOCKET === "unix") {
    const require = createRequire(import.meta.url);
    try {
      const PosixSocket = require("posix-socket");
      const PosixSocketMessaging = require("posix-socket-messaging");
      return generateUnixSocket(PosixSocket, PosixSocketMessaging);
    } /* c8 ignore start */ catch (error) {
      if (
        hasOwnProperty(error, "code") &&
        (error.code === "ERR_MODULE_NOT_FOUND" ||
          error.code === "MODULE_NOT_FOUND")
      ) {
        return NetSocket;
      } else {
        throw error;
      }
    } /* c8 ignore stop */
  } else {
    return NetSocket;
  }
};
