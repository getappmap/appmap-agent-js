import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import ConfigurationBoot from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const {
  loadRootConfiguration,
  createRootConfiguration,
  extendConfigurationFile,
  extendConfigurationArgv,
} = ConfigurationBoot(await buildTestDependenciesAsync(import.meta.url));

// createRootConfiguration
const configuration = createRootConfiguration("/directory", {
  APPMAP_REPOSITORY_DIRECTORY: "/repository",
});

// loadRootConfiguration
assertDeepEqual(
  configuration,
  loadRootConfiguration({
    APPMAP_CONFIGURATION: JSON.stringify(configuration),
  }),
);

// extendConfigurationFile
{
  const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await writeFile(path, "app: foo", "utf8");
  const { app } = extendConfigurationFile(configuration, "/directory", {
    APPMAP_CONFIGURATION_PATH: path,
  });
  assertEqual(app, "foo");
}

// extendConfigurationArgv
{
  const { app, scenarios } = extendConfigurationArgv(
    configuration,
    "/directory",
    ["node", "main.js", "--app", "foo", "--", "exec", "argv0"],
  );
  assertEqual(app, "foo");
  assertEqual(scenarios.anonymous.length, 1);
}
