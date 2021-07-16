Reflect.defineProperty(global.process.env, "APPMAP_LOG_LEVEL", {
  __proto__: null,
  value: "WARN",
  writable: true,
  configurable: true,
  enumerable: true,
});

import("./log.mjs").then(({ logInfo, logError }) => {
  logInfo("foo");
  logError("bar");
});
