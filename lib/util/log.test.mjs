
Reflect.defineProperty(
  process.env,
  "APPMAP_LOG",
  {
    __proto__: null,
    value: "",
    writable: true,
    configurable: true,
    enumerable: true
  }
);

import('../../../../lib/server/logger.mjs').then(({log}) => {
  log("foo");
});
