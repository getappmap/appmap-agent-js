import { createRequire } from "module";

const {
  URLSearchParams,
  process: { env },
} = globalThis;

const { loadEnvironmentConfiguration } = await import(
  `../../components/configuration-environment/index.mjs?${new URLSearchParams({
    env: "node",
    violation: "exit",
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

export const params = new URLSearchParams({
  env: "node",
  violation: "exit",
  "log-level": configuration.log.level,
  "log-file": configuration.log.file,
  socket: configuration.socket,
  emitter: "remote-socket",
  "validate-appmap": configuration.validate.appmap ? "on" : "off",
  "validate-message": configuration.validate.message ? "on" : "off",
});
