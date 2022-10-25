import { assertEqual } from "../../__fixture__.mjs";
import "./index.mjs?env=test";
import {
  logWarning,
  logWarningWhen,
  logInfo,
} from "./index.mjs?env=test&log-level=warning";

logInfo("foo");
logWarning("bar");
assertEqual(logWarningWhen(true, "qux"), true);
assertEqual(logWarningWhen(false, "qux"), false);
