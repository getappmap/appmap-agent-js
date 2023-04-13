// NB: Synchronous loggin is important to avoid infinite loop when async hooks are enabled.
import { openSync, writeSync } from "node:fs";
import { InternalAppmapError } from "../../error/index.mjs";

const { URL } = globalThis;

const openLogFile = (specifier) => {
  if (typeof specifier === "number") {
    return specifier;
  } else if (typeof specifier === "string") {
    return openSync(new URL(specifier), "w");
  } else {
    throw new InternalAppmapError("invalid specifier type for log file");
  }
};

const generateLog = (fd, name) => (message) => {
  writeSync(fd, `APPMAP-${name} ${message}\n`);
};

export const makeLog = (specifier) => {
  const fd = openLogFile(specifier);
  return {
    logDebug: generateLog(fd, "DEBUG"),
    logInfo: generateLog(fd, "INFO"),
    logWarning: generateLog(fd, "WARNING"),
    logError: generateLog(fd, "ERROR"),
  };
};
