import { buildAsync } from "../../../build/index.mjs";
import Log from "./index.mjs";

Reflect.defineProperty(global.process.env, "APPMAP_LOG_LEVEL", {
  __proto__: null,
  value: "WARN",
  writable: true,
  configurable: true,
  enumerable: true,
});

const mainAsync = async () => {
  const { logInfo, logError } = Log(
    await buildAsync({
      util: "default",
      expect: "error",
    }),
  );
  logInfo("foo");
  logError("bar");
};

mainAsync();
