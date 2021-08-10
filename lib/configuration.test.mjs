import { writeFile, mkdir, symlink } from "fs/promises";
import { tmpdir } from "os";
import { strict as Assert } from "assert";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

import {
  loadRootConfiguration,
  createRootConfiguration,
  extendConfigurationFile,
  extendConfigurationArgv,
  isConfigurationEnabled,
} from "./configuration.mjs";

const { cwd } = process;

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
await mkdir(directory);
await writeFile(
  `${directory}/package.json`,
  JSON.stringify({ name: "name", version: "1.2.3" }),
);
await mkdir(`${directory}/node_modules`);
await mkdir(`${directory}/node_modules/@appland`);
await symlink(cwd(), `${directory}/node_modules/@appland/appmap-agent-js`);

// createRootConfiguration
const configuration = createRootConfiguration(directory, {
  APPMAP_REPOSITORY_DIRECTORY: directory,
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
  await writeFile(`${directory}/configuration.yml`, "app: foo", "utf8");
  const { app } = extendConfigurationFile(configuration, directory, {
    APPMAP_CONFIGURATION_PATH: `${directory}/configuration.yml`,
  });
  assertEqual(app, "foo");
}

// extendConfigurationArgv
{
  const { app, children } = extendConfigurationArgv(configuration, directory, [
    "node",
    "main.js",
    "--app",
    "foo",
    "--",
    "exec",
    "argv0",
  ]);
  assertEqual(app, "foo");
  assertEqual(children.length, 1);
}

// isConfigurationEnabled
{
  await writeFile(
    `${directory}/configuration.yml`,
    "enabled: [foo.js]",
    "utf8",
  );
  const configuration2 = extendConfigurationFile(configuration, directory, {
    APPMAP_CONFIGURATION_PATH: `${directory}/configuration.yml`,
  });
  assertEqual(
    isConfigurationEnabled(configuration2, directory, ["node", "foo.js"]),
    true,
  );
  assertEqual(
    isConfigurationEnabled(configuration2, directory, ["node", "bar.js"]),
    false,
  );
}
