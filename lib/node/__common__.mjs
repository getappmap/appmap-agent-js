import { createRequire } from "module";
import ConfigurationEnvironment from "../../dist/node/configuration-environment.mjs";
import Loader from "../../dist/node/loader.mjs";
const { loadEnvironmentConfiguration } = ConfigurationEnvironment({
  log: "info",
});
const { env } = process;
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
const { log } = configuration;
const { createLoaderHooks } = Loader({ log: log.level });
export const { transformSourceAsync: transformSource, loadAsync: load } =
  createLoaderHooks();
