import "../../__fixture__.mjs";
import "./index.mjs?env=test";
import {
  logWarning,
  logWarningWhen,
  logInfo,
} from "./index.mjs?env=test&log-level=warning";

logInfo("foo");
logWarning("bar");
logWarningWhen(true, "qux");
logWarningWhen(false, "qux");
