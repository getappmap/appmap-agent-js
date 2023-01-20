import { env } from "node:process";
import { assertEqual } from "../../__fixture__.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

defineProperty(env, "APPMAP_TEST_LOGGING", {
  __proto__: null,
  value: "1",
  writable: true,
  configurable: true,
  enumerable: true,
});

const { logWarning, logWarningWhen, logInfo } = await import("./index.mjs");

logInfo("foo");
logWarning("bar");
assertEqual(logWarningWhen(true, "qux"), true);
assertEqual(logWarningWhen(false, "qux"), false);
