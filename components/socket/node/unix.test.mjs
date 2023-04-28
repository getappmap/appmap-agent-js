import { platform as getPlatform } from "node:os";
import { createRequire } from "node:module";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { testAsync } from "./__fixture__.mjs";
import { generateUnixSocket } from "./unix.mjs";

if (getPlatform() !== "win32") {
  const require = createRequire(import.meta.url);
  const {
    createSocket,
    isSocketReady,
    openSocketAsync,
    sendSocket,
    closeSocketAsync,
  } = generateUnixSocket(
    require("posix-socket"),
    require("posix-socket-messaging"),
  );
  const runAsync = async (port) => {
    const socket = createSocket({
      host: "localhost",
      "trace-port": port,
    });
    assertEqual(isSocketReady(socket), false);
    sendSocket(socket, "before");
    await openSocketAsync(socket);
    assertEqual(isSocketReady(socket), true);
    sendSocket(socket, "message");
    await closeSocketAsync(socket);
    assertEqual(isSocketReady(socket), false);
    sendSocket(socket, "after");
  };
  assertDeepEqual(await testAsync(0, runAsync), ["message"]);
  assertDeepEqual(
    await testAsync(toAbsoluteUrl(getUuid(), getTmpUrl()), runAsync),
    ["message"],
  );
}
