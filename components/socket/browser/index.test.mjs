/* eslint-env node */

import { assertDeepEqual } from "../../__fixture__.mjs";

const trace = [];

globalThis.WebSocket = function (url) {
  trace.push(["open", url]);
  return {
    send(message) {
      trace.push(["send", message]);
    },
    close() {
      trace.push(["close"]);
    },
  };
};

const { openSocket, sendSocket, closeSocket } = await import("./index.mjs");

const socket = openSocket("host", 8080);
sendSocket(socket, "message");
closeSocket(socket);

assertDeepEqual(trace, [
  ["open", "wss://host:8080"],
  ["send", "message"],
  ["close"],
]);
