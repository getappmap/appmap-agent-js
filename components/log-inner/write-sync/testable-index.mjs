// NB: Synchronous loggin is important to avoid infinite loop when async hooks are enabled.
import { openSync, writeSync } from "fs";
import { hasOwnProperty } from "../../util/index.mjs";

const { URL, parseInt } = globalThis;

export default (params) => {
  const openLogFile = (name) =>
    /^[0-9]+$/u.test(name) ? parseInt(name) : openSync(new URL(name), "w");
  const fd = hasOwnProperty(params, "log-file")
    ? openLogFile(params["log-file"])
    : 1;
  const generateLog = (name) => (message) => {
    writeSync(fd, `APPMAP-${name} ${message}\n`);
  };
  return {
    logDebug: generateLog("DEBUG"),
    logInfo: generateLog("INFO"),
    logWarning: generateLog("WARNING"),
    logError: generateLog("ERROR"),
  };
};
