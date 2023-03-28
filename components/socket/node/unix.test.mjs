import { platform as getPlatform } from "node:os";
import { createRequire } from "node:module";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { testAsync } from "./__fixture__.mjs";
import { generateUnixSocket } from "./unix.mjs";

if (getPlatform() !== "win32") {
  const require = createRequire(import.meta.url);
  const { openSocket, closeSocket, sendSocket } = generateUnixSocket(
    require("posix-socket"),
    require("posix-socket-messaging"),
  );
  const runAsync = (port) => {
    const socket = openSocket({
      host: "localhost",
      "trace-port": port,
    });
    sendSocket(socket, "message");
    closeSocket(socket);
  };
  assertDeepEqual(await testAsync(0, runAsync), ["message"]);
  assertDeepEqual(
    await testAsync(toAbsoluteUrl(getUuid(), getTmpUrl()), runAsync),
    ["message"],
  );
}
