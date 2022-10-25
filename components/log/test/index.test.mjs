import "../../__fixture__.mjs";

import {
  logWarning,
  logWarningWhen,
  logInfo,
} from "./index.mjs?env=test&log-level=warning";

logInfo("foo");
logWarning("bar");
logWarningWhen(true, "qux");
logWarningWhen(false, "qux");
