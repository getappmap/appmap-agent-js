const { URL, parseInt } = globalThis;

const { search: __search, searchParams: __params } = new URL(import.meta.url);

// NB: Synchronous loggin is important to avoid infinite loop when async hooks are enabled.
import { openSync, writeSync } from "fs";

const openLogFile = (name) =>
  /^[0-9]+$/u.test(name) ? parseInt(name) : openSync(new URL(name), "w");

const fd = __params.has("log-file") ? openLogFile(__params.get("log-file")) : 1;

const generateLog = (name) => (message) => {
  writeSync(fd, `APPMAP-${name} ${message}\n`);
};

export const logDebug = generateLog("DEBUG");

export const logInfo = generateLog("INFO");

export const logWarning = generateLog("WARNING");

export const logError = generateLog("ERROR");
