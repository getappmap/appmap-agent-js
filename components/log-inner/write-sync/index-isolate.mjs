// NB: Synchronous loggin is important to avoid infinite loop when async hooks are enabled.
import { openSync, writeSync } from "fs";
import { hasOwnProperty } from "../../util/index.mjs";

const { URL, parseInt } = globalThis;

const openLogFile = (specifier) =>
  /^[0-9]+$/u.test(specifier)
    ? parseInt(specifier)
    : openSync(new URL(specifier), "w");

const generateLog = (fd, name) => (message) => {
  writeSync(fd, `APPMAP-${name} ${message}\n`);
};

export const makeLog = (env) => {
  const fd = hasOwnProperty(env, "APPMAP_LOG_FILE")
    ? openLogFile(env.APPMAP_LOG_FILE)
    : 1;
  return {
    logDebug: generateLog(fd, "DEBUG"),
    logInfo: generateLog(fd, "INFO"),
    logWarning: generateLog(fd, "WARNING"),
    logError: generateLog(fd, "ERROR"),
  };
};
