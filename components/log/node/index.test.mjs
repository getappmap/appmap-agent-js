import { buildTestAsync } from "../../build.mjs";

const { env } = process;

const testAsync = async () => {
  Reflect.defineProperty(env, "APPMAP_LOG_LEVEL", {
    __proto__: null,
    configurable: true,
    enumerable: true,
    value: "INFO",
    writable: true,
  });
  const { default: Log } = await import("./index.mjs");
  const { logInfo, logError } = Log(await buildTestAsync(import.meta));
  logInfo("foo");
  logError("bar");
};

testAsync();
