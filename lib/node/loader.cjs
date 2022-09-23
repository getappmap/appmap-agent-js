/* globals APPMAP_ESM_HOOK */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_ESM_HOOK"] */

const {runInThisContext} = require("node:vm");

const {
  process: { version },
} = globalThis;

if (typeof APPMAP_ESM_HOOK === "undefined") {
  runInThisContext("let APPMAP_ESM_HOOK = null;");
}

if (version.startsWith("v14.")) {
  exports.transformSource = (content, context, next) => {
    if (APPMAP_ESM_HOOK === null) {
      return next(content, context, next);
    } else {
      return APPMAP_ESM_HOOK.transformSource(content, context, next);
    }
  };
} else {
  exports.load = (url, context, next) => {
    if (APPMAP_ESM_HOOK === null) {
      return next(url, context, next);
    } else {
      return APPMAP_ESM_HOOK.load(url, context, next);
    }
  };
}
