import ConfigurationEnvironment from "../../dist/node/configuration-environment.mjs";
import Loader from "../../dist/node/loader.mjs";
const { loadEnvironmentConfiguration } = ConfigurationEnvironment({});
const { env } = process;
export const configuration = loadEnvironmentConfiguration(env);
const { log } = configuration;
const { createLoaderHooks } = Loader({ log });
export const { transformSourceAsync: transformSource, loadAsync: load } =
  createLoaderHooks();
