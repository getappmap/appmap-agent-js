const { URL, parseInt } = globalThis;

const { search: __search, searchParams: __params } = new URL(import.meta.url);

// NB: Synchronous loggin is important to avoid
//  infinite loop when async hooks are enabled.
import { openSync, writeSync } from "fs";
const { format } = await import(`../../util/index.mjs${__search}`);

const openLogFile = (name) =>
  /^[0-9]+$/u.test(name) ? parseInt(name) : openSync(new URL(name), "w");

const fd = __params.has("log-file") ? openLogFile(__params.get("log-file")) : 1;

const generateLog =
  (name) =>
  (template, ...values) => {
    writeSync(fd, `APPMAP-${name} ${format(template, values)}\n`);
  };

export const logDebug = generateLog("DEBUG");

export const logInfo = generateLog("INFO");

export const logWarning = generateLog("WARNING");

export const logError = generateLog("ERROR");
