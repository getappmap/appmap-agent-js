import { assertEqual } from "../../__fixture__.mjs";

import { logWarning, logWarningWhen, logInfo } from "./index.mjs";

logInfo("foo");
logWarning("bar");
assertEqual(logWarningWhen(true, "qux"), true);
assertEqual(logWarningWhen(false, "qux"), false);
