/* globals APPMAP_ESM_HOOK */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_ESM_HOOK"] */

import { createRequire } from "module";

const {
  URLSearchParams,
  JSON: { stringify: stringifyJSON },
  process: { env },
} = globalThis;

const { loadEnvironmentConfiguration } = await import(
  `../../components/configuration-environment/index.mjs?${new URLSearchParams({
    env: "node",
    violation: "exit",
    log: "info",
  }).toString()}`
);

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

env.APPMAP_LOG_FILE = stringifyJSON(configuration.log.file);

export const params = new URLSearchParams({
  env: "node",
  violation: "exit",
  log: configuration.log.level,
  socket: configuration.socket,
  emitter: "remote-socket",
  "validate-appmap": configuration.validate.appmap ? "on" : "off",
  "validate-message": configuration.validate.message ? "on" : "off",
});

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
