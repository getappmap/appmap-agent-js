import { buildAsync } from "../../../build.mjs";

Reflect.defineProperty(global.process.env, "APPMAP_LOG_LEVEL", {
  __proto__: null,
  value: "WARN",
  writable: true,
  configurable: true,
  enumerable: true,
});

const mainAsync = async () => {
  const { logInfo, logError } = await buildAsync("log", {
    log: "node",
    expect: "error",
  });
  logInfo("foo");
  logError("bar");
};

mainAsync().catch((error) => {
  throw error;
});
