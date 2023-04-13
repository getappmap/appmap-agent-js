import { assertEqual } from "../../__fixture__.mjs";
import { defineGlobal } from "../../global/index.mjs";

defineGlobal("__APPMAP_LOG_LEVEL__", "info");
const { logWarning, logWarningWhen, logInfo } = await import("./index.mjs");

logInfo("foo");
logWarning("bar");
assertEqual(logWarningWhen(true, "qux"), true);
assertEqual(logWarningWhen(false, "qux"), false);
