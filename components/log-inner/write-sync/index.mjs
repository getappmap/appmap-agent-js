import makeLog from "./testable-index.mjs";
import params from "../../params.mjs";
export const { logDebug, logInfo, logWarning, logError } = makeLog(params);
