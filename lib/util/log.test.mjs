Reflect.defineProperty(global.process.env, "APPMAP_LOG", {
  __proto__: null,
  value: "",
  writable: true,
  configurable: true,
  enumerable: true,
});

import("./log.mjs").then(({ log }) => {
  log("foo");
});
