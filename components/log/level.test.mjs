import { strict as Assert } from "assert";
import { levelLog } from "./level.mjs";

const { deepEqual: assertDeepEqual, throws: assertThrows } = Assert;

assertThrows(() => levelLog({}, "logMissing"), /^Error: missing map key/);

const trace = [];

const { logDebug, logInfo, logWarning } = levelLog(
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
  "logInfo",
);

logDebug("DEBUG");
logInfo("INFO");
logWarning("WARNING");

assertDeepEqual(trace, [
  ["info", "INFO"],
  ["warning", "WARNING"],
]);
