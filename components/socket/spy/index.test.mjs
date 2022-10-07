import { assertDeepEqual } from "../../__fixture__.mjs";
import { openSocket, closeSocket, sendSocket } from "./index.mjs?env=test";

const socket = openSocket("host", "port", {});

sendSocket(socket, "message");

closeSocket(socket);

assertDeepEqual(globalThis.SOCKET_TRACE, [
  { type: "open", host: "host", port: "port" },
  { type: "send", socket: "socket", message: "message" },
  { type: "close", socket: "socket" },
]);
