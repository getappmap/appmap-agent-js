import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import LoadEnvironmentConfiguration from "./index.mjs";

const {JSON:{stringify:stringifyJSON}} = globalThis;

const { createConfiguration } = await buildTestComponentAsync("configuration");

const { loadEnvironmentConfiguration } = LoadEnvironmentConfiguration(
  await buildTestDependenciesAsync(import.meta.url),
);

loadEnvironmentConfiguration({
  APPMAP_CONFIGURATION: stringifyJSON(createConfiguration("file:///home")),
});
