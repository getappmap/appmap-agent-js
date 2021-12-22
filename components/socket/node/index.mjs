import { platform as getPlatform } from "os";

import MakePosixSocket from "./posix.mjs";
import MakeNetSocket from "./net.mjs";

export default (dependencies) => {
  const {
    log: { logGuardWarning },
  } = dependencies;
  const PosixSocket = MakePosixSocket(dependencies);
  if (PosixSocket === null) {
    return MakeNetSocket(dependencies);
  } else {
    logGuardWarning(
      getPlatform() === "win32",
      "Some optional dependencies are missing. Fallback to fs.writeSync to perform synchronous communication which is slower.",
    );
    return PosixSocket;
  }
};
