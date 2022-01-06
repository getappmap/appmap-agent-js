import { buildTestDependenciesAsync } from "../../build.mjs";
import { assertDeepEqual } from "../../__fixture__.mjs";
import SpySocket from "./index.mjs";

const { openSocket, closeSocket, sendSocket } = SpySocket(
  await buildTestDependenciesAsync(import.meta.url),
);

const socket = openSocket("host", "port", {});
sendSocket(socket, "message");
closeSocket(socket);
assertDeepEqual(global.SOCKET_TRACE, [
  { type: "open", host: "host", port: "port" },
  { type: "send", socket: "socket", message: "message" },
  { type: "close", socket: "socket" },
]);
