import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Boot from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  // fail: assertFail,
  equal: assertEqual,
} = Assert;

const { bootBatch, bootProcessRecorder, bootManualRecorder } = Boot(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const { cwd } = process;

///////////////
// bootBatch //
///////////////

{
  const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  bootBatch({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: ["node", "main.mjs"],
    cwd,
  });
  await writeFile(path, "app: app", "utf8");
  const { app, name } = bootBatch({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: ["node", "main.mjs", "--name", "name"],
    cwd,
  });
  assertDeepEqual(
    { app, name },
    {
      app: "app",
      name: "name",
    },
  );
}

///////////////////////////
// bootAutomatedRecorder //
///////////////////////////

{
  const configuration = createConfiguration("/repository");
  assertDeepEqual(
    extendConfiguration(configuration, { main: "main.mjs" }, "/cwd"),
    bootProcessRecorder({
      env: {
        APPMAP_CONFIGURATION: JSON.stringify(configuration),
      },
      argv: ["node", "main.mjs"],
      cwd: () => "/cwd",
    }),
  );
}

////////////////////////
// bootManualRecorder //
////////////////////////

{
  const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await writeFile(path, "app: app", "utf8");
  {
    const { app } = bootManualRecorder("/home", path, "/base");
    assertEqual(app, "app");
  }
}
