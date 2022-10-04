const {
  URL,
  process,
  JSON: { parse: parseJSON },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

// NB: Synchronous loggin is important to avoid
//  infinite loop when async hooks are enabled.
import { openSync, writeSync } from "fs";
const { format, hasOwnProperty } = await import(
  `../../util/index.mjs${__search}`
);

let fd;

export const reloadLogFile = () => {
  const file = hasOwnProperty(process.env, "APPMAP_LOG_FILE")
    ? parseJSON(process.env.APPMAP_LOG_FILE)
    : 2;
  fd = typeof file === "number" ? file : openSync(new URL(file), "w");
};

reloadLogFile();

const generateLog =
  (name) =>
  (template, ...values) => {
    writeSync(fd, `APPMAP-${name} ${format(template, values)}\n`);
  };

export const logDebug = generateLog("DEBUG");

export const logInfo = generateLog("INFO");

export const logWarning = generateLog("WARNING");

export const logError = generateLog("ERROR");
