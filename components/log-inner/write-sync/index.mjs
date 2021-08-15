// NB: Synchronous loggin is important to avoid
//  infinite loop when async hooks are enabled.
import { writeSync } from "fs";

export default (dependencies) => {
  const {
    util: { format },
  } = dependencies;
  const generateLog = (name) => {
    const fd = name === "WARNING" || name === "ERROR" ? 2 : 1;
    return (template, ...values) => {
      writeSync(fd, `APPMAP-${name} ${format(template, values)}\n`);
    };
  };
  return {
    logDebug: generateLog("DEBUG"),
    logInfo: generateLog("INFO"),
    logWarning: generateLog("WARNING"),
    logError: generateLog("ERROR"),
  };
};
