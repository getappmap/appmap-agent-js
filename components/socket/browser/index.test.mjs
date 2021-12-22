/* eslint-env node */

import { strict as Assert } from "assert";

import { buildTestDependenciesAsync } from "../../build.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const trace = [];

global.WebSocket = function (url) {
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

const { default: Socket } = await import("./index.mjs");

const { openSocket, sendSocket, closeSocket } = Socket(
  await buildTestDependenciesAsync(import.meta.url),
);

const socket = openSocket("host", "port");
sendSocket(socket, "message");
closeSocket(socket);

assertDeepEqual(trace, [
  ["open", "wss://host:port"],
  ["send", "message"],
  ["close"],
]);
