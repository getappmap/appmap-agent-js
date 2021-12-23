import {
  getFreshTemporaryPath,
  assertDeepEqual,
  assertEqual,
} from "../../__fixture__.mjs";
import Module from "module";
import { buildTestDependenciesAsync } from "../../build.mjs";
import { testAsync } from "./__fixture__.mjs";

const { createRequire } = Module;
let require = null;
Module.createRequire = (url) => (path) => require(path);

const { default: PosixSocket } = await import("./posix.mjs");

require = (path) => {
  throw new Error("BOUM");
};
assertEqual(
  PosixSocket(await buildTestDependenciesAsync(import.meta.url)),
  null,
);

require = createRequire(import.meta.url);

const { openSocket, closeSocket, sendSocket } = PosixSocket(
  await buildTestDependenciesAsync(import.meta.url),
);

const runAsync = async (port) => {
  const socket = openSocket("127.0.0.1", port);
  sendSocket(socket, "message");
  closeSocket(socket);
};

assertDeepEqual(await testAsync(0, runAsync), ["message"]);

assertDeepEqual(await testAsync(getFreshTemporaryPath(), runAsync), [
  "message",
]);
