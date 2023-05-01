import { platform } from "node:process";
import { createRequire } from "node:module";
import { testAsync } from "./__fixture__.mjs";
import { generateUnixSocket } from "./unix.mjs";

if (platform !== "win32") {
  const require = createRequire(import.meta.url);
  await testAsync(
    generateUnixSocket(
      require("posix-socket"),
      require("posix-socket-messaging"),
    ),
  );
}
