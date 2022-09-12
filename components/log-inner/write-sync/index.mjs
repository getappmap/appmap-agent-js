// NB: Synchronous loggin is important to avoid
//  infinite loop when async hooks are enabled.
import { openSync, writeSync } from "fs";

const {
  URL,
  process,
  JSON: { parse: parseJSON },
} = globalThis;

export default (dependencies) => {
  const {
    util: { format, hasOwnProperty },
  } = dependencies;
  const file = hasOwnProperty(process.env, "APPMAP_LOG_FILE")
    ? parseJSON(process.env.APPMAP_LOG_FILE)
    : 2;
  const fd = typeof file === "number" ? file : openSync(new URL(file), "w");
  const generateLog =
    (name) =>
    (template, ...values) => {
      writeSync(fd, `APPMAP-${name} ${format(template, values)}\n`);
    };
  return {
    logDebug: generateLog("DEBUG"),
    logInfo: generateLog("INFO"),
    logWarning: generateLog("WARNING"),
    logError: generateLog("ERROR"),
  };
};
