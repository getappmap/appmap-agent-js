import { platform as getPlatform } from "os";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { testAsync } from "../__fixture__.mjs";

if (getPlatform() !== "win32") {
  const { openSocket, closeSocket, sendSocket } = await import("./index.mjs");

  const runAsync = (port) => {
    const socket = openSocket("127.0.0.1", port);
    sendSocket(socket, "message");
    closeSocket(socket);
  };

  assertDeepEqual(await testAsync(0, runAsync), ["message"]);

  assertDeepEqual(
    await testAsync(toAbsoluteUrl(getUuid(), getTmpUrl()), runAsync),
    ["message"],
  );
}
