import { platform as getPlatform } from "os";
import { getFreshTemporaryURL, assertDeepEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import { testAsync } from "../__fixture__.mjs";

if (getPlatform() !== "win32") {
  const { default: Socket } = await import("./index.mjs");

  const { openSocket, closeSocket, sendSocket } = Socket(
    await buildTestDependenciesAsync(import.meta.url),
  );

  const runAsync = (port) => {
    const socket = openSocket("127.0.0.1", port);
    sendSocket(socket, "message");
    closeSocket(socket);
  };

  assertDeepEqual(await testAsync(0, runAsync), ["message"]);

  assertDeepEqual(await testAsync(getFreshTemporaryURL(), runAsync), [
    "message",
  ]);
}
