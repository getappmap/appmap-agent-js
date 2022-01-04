import { makeAbsolutePath } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import LoadEnvironmentConfiguration from "./index.mjs";

const { createConfiguration } = await buildTestComponentAsync("configuration");

const { loadEnvironmentConfiguration } = LoadEnvironmentConfiguration(
  await buildTestDependenciesAsync(import.meta.url),
);

loadEnvironmentConfiguration({
  APPMAP_CONFIGURATION: JSON.stringify(
    createConfiguration(makeAbsolutePath("cwd")),
  ),
});
