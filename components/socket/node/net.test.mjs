import { assertDeepEqual, getFreshTemporaryPath } from "../../__fixture__.mjs";

import { buildTestDependenciesAsync } from "../../build.mjs";
import NetSocket from "./net.mjs";
import { testAsync } from "./__fixture__.mjs";

const { openSocket, closeSocket, sendSocket } = NetSocket(
  await buildTestDependenciesAsync(import.meta.url),
);
const sleepAsync = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
const runAsync = async (port) => {
  const socket = openSocket("localhost", port);
  sendSocket(socket, "message1");
  await sleepAsync(1000);
  sendSocket(socket, "message2");
  closeSocket(socket);
  await sleepAsync(1000);
  sendSocket(socket, "message3");
};
assertDeepEqual(await testAsync(0, runAsync), ["message1", "message2"]);
assertDeepEqual(await testAsync(getFreshTemporaryPath(), runAsync), [
  "message1",
  "message2",
]);
