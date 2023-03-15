import { readGlobal } from "../../global/index.mjs";
import { makeLog } from "./index-isolate.mjs";

export const { logDebug, logInfo, logWarning, logError } = makeLog(
  readGlobal("__APPMAP_LOG_FILE__"),
);
