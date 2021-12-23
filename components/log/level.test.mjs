import { assertDeepEqual, assertThrow } from "../__fixture__.mjs";
import { levelLog } from "./level.mjs";

assertThrow(() => levelLog({}, "logMissing"), /^Error: missing map key/);

const trace = [];

const { logDebug, logInfo, logGuardInfo, logWarning, logGuardWarning } =
  levelLog(
    {
      logDebug: (message) => {
        trace.push(["debug", message]);
      },
      logInfo: (message) => {
        trace.push(["info", message]);
      },
      logWarning: (message) => {
        trace.push(["warning", message]);
      },
    },
    "Info",
  );

logDebug("DEBUG");
logInfo("INFO");
logGuardInfo(true, "GUARD-INFO");
logWarning("WARNING");
logGuardWarning(false, "GUARD-WARNING");

assertDeepEqual(trace, [
  ["info", "INFO"],
  ["info", "GUARD-INFO"],
  ["warning", "WARNING"],
]);
