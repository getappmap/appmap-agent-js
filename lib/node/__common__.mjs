/* eslint local/no-globals: ["error", "globalThis"] */

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
