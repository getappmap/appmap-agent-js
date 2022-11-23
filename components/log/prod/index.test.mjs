import { assertEqual } from "../../__fixture__.mjs";
import "./index.mjs";
import {
  logWarning,
  logWarningWhen,
  logInfo,
} from "./index.mjs&log-level=warning";

logInfo("foo");
logWarning("bar");
assertEqual(logWarningWhen(true, "qux"), true);
assertEqual(logWarningWhen(false, "qux"), false);
