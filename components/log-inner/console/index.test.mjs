import "../../__fixture__.mjs";
import { logDebug, logInfo, logWarning, logError } from "./index.mjs?env=test";

logDebug("debug");
logInfo("info");
logWarning("warning");
logError("error");
