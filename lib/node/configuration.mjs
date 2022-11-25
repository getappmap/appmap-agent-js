import { createRequire } from "module";
import { loadComponentAsync } from "../load.mjs";

const {
  process: { env },
} = globalThis;

const { loadEnvironmentConfiguration } = await loadComponentAsync(
  "configuration-environment",
  { env: "node" },
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

export const params = {
  env: "node",
  "log-level": configuration.log.level,
  "log-file": configuration.log.file,
  socket: configuration.socket,
  emitter: "remote-socket",
  "validate-appmap": configuration.validate.appmap ? "on" : "off",
  "validate-message": configuration.validate.message ? "on" : "off",
};
