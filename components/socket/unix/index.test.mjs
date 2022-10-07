import { platform as getPlatform } from "os";
import { getFreshTemporaryURL, assertDeepEqual } from "../../__fixture__.mjs";
import { testAsync } from "../__fixture__.mjs";

if (getPlatform() !== "win32") {
  const { openSocket, closeSocket, sendSocket } = await import(
    "./index.mjs?env=test"
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
