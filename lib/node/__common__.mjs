/* globals APPMAP_ESM_HOOK */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_ESM_HOOK"] */

import { createRequire } from "module";
import ConfigurationEnvironment from "../../dist/node/configuration-environment.mjs";
const { loadEnvironmentConfiguration } = ConfigurationEnvironment({
  log: "info",
});

const {
  process: { env },
} = globalThis;

export const configuration = loadEnvironmentConfiguration(env);
if (configuration.socket === "unix") {
  const require = createRequire(import.meta.url);
  const isPresent = (module) => {
    try {
      require(module);
      return true;
    } catch {
      return false;
    }
  };
  if (!isPresent("posix-socket") || !isPresent("posix-socket-messaging")) {
    configuration.socket = "net";
  }
}

export const transformSource = (content, context, next) => {
  if (typeof APPMAP_ESM_HOOK === "undefined") {
    return next(content, context, next);
  } else {
    return APPMAP_ESM_HOOK.transformSource(content, context, next);
  }
};

export const load = (url, context, next) => {
  if (typeof APPMAP_ESM_HOOK === "undefined") {
    return next(url, context, next);
  } else {
    return APPMAP_ESM_HOOK.load(url, context, next);
  }
};
