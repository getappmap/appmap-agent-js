/* globals APPMAP_ESM_HOOK */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_ESM_HOOK"] */

import { runInThisContext } from "vm";

const {
  process: { stdout },
} = globalThis;

if (typeof APPMAP_ESM_HOOK === "undefined") {
  runInThisContext("let APPMAP_ESM_HOOK = null;");
}

stdout.write(
  "If present, please ignore node's deprecation warning about obselete loader hooks\n",
);

export const transformSource = (content, context, next) => {
  if (APPMAP_ESM_HOOK === null) {
    return next(content, context, next);
  } else {
    return APPMAP_ESM_HOOK.transformSource(content, context, next);
  }
};

export const load = (url, context, next) => {
  if (APPMAP_ESM_HOOK === null) {
    return next(url, context, next);
  } else {
    return APPMAP_ESM_HOOK.load(url, context, next);
  }
};
