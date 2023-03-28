import { assertDeepEqual } from "../../__fixture__.mjs";
import { readGlobal } from "../../global/index.mjs";
import { openSocket, closeSocket, sendSocket } from "./index.mjs";

const socket = openSocket("host", "port", {});

sendSocket(socket, "message");

closeSocket(socket);

assertDeepEqual(readGlobal("SOCKET_TRACE"), [
  { type: "open" },
  { type: "send", socket: "socket", message: "message" },
  { type: "close", socket: "socket" },
]);
