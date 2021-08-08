import { buildDependenciesAsync } from "../../build.mjs";

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
  const { logInfo, logError } = Log(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  logInfo("foo");
  logError("bar");
};

testAsync();
