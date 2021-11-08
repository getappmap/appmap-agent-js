import LoadEnvironmentConfiguration from "../../dist/node/load-environment-configuration.mjs";
import Loader from "../../dist/node/loader.mjs";
const { loadEnvironmentConfiguration } = LoadEnvironmentConfiguration({});
const { env } = process;
export const configuration = loadEnvironmentConfiguration(env);
const { log } = configuration;
const { createLoaderHooks } = Loader({ log });
export const { transformSourceAsync: transformSource, loadAsync: load } =
  createLoaderHooks();
