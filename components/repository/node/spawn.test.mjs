import { platform as getPlatform } from "node:os";
import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { spawn } from "./spawn.mjs?env=test";

assertThrow(
  () => spawn("MISSING EXECUTABLE", [], import.meta.url),
  /^ExternalAppmapError: Failed to spawn executable$/u,
);

// Could not make this work in windows...
// This commands seem to work.
// But the prowershell process does not close with a signal.
// - powershell -c 'kill $PID'
// - powershell -c 'Stop-Process -Id $Pid -Force'
// - powershell -c 'taskkill /f /PID $PID'
if (getPlatform() !== "win32") {
  assertThrow(
    () => spawn("/bin/sh", ["-c", "kill $$"], import.meta.url),
    /^ExternalAppmapError: Command exit with unexpected kill signal$/u,
  );
}

assertEqual(
  spawn(
    getPlatform() === "win32" ? "powershell" : "/bin/sh",
    ["-c", "exit 1"],
    import.meta.url,
  ),
  null,
);

assertEqual(
  spawn(
    getPlatform() === "win32" ? "powershell" : "/bin/sh",
    ["-c", "echo FOO"],
    import.meta.url,
  ),
  "FOO",
);
