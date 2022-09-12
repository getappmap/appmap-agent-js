import { assertDeepEqual, getFreshTemporaryURL } from "../../__fixture__.mjs";

import { buildTestDependenciesAsync } from "../../build.mjs";
import Socket from "./index.mjs";
import { testAsync } from "../__fixture__.mjs";

const { Promise, setTimeout } = globalThis;

const { openSocket, closeSocket, sendSocket } = Socket(
  await buildTestDependenciesAsync(import.meta.url),
);
const sleepAsync = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
const runAsync = async (port) => {
  const socket = openSocket("localhost", port, {
    heartbeat: 10000,
    threshold: 0,
  });
  sendSocket(socket, "message1");
  await sleepAsync(1000);
  sendSocket(socket, "message2");
  closeSocket(socket);
  await sleepAsync(1000);
  sendSocket(socket, "message3");
};
assertDeepEqual(await testAsync(0, runAsync), ["message1", "message2"]);
assertDeepEqual(await testAsync(getFreshTemporaryURL(), runAsync), [
  "message1",
  "message2",
]);
