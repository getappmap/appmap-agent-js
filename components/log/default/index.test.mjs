import "../../__fixture__.mjs";
import "./index.mjs?env=test";
import {
  logWarning,
  logGuardWarning,
  logInfo,
} from "./index.mjs?env=test&log-level=warning";

logInfo("foo");
logWarning("bar");
logGuardWarning(true, "qux");
logGuardWarning(false, "qux");
