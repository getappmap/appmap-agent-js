import { env } from "node:process";
import { makeLog } from "./index-isolate.mjs";
export const { logDebug, logInfo, logWarning, logError } = makeLog(env);
