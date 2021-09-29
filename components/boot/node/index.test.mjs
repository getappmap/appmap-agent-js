import { readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import YAML from "yaml";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Boot from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  fail: assertFail,
  equal: assertEqual,
} = Assert;

const {
  bootBatchAsync,
  bootEmptyRecorder,
  bootManualRecorder,
  bootManualRecorderAsync,
} = Boot(await buildTestDependenciesAsync(import.meta.url));

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const { cwd } = process;

////////////////////
// bootBatchAsync //
////////////////////

{
  const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await writeFile(path, "app: app", "utf8");
  const {
    mode,
    app,
    name,
    scenarios: {
      anonymous: [{ exec, argv }],
    },
  } = await bootBatchAsync({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: ["node", "batch.mjs", "--name", "name", "--", "exec", "argv0"],
    cwd,
  });
  assertDeepEqual(
    { mode, app, name, exec, argv },
    {
      mode: "remote",
      app: "app",
      name: "name",
      exec: "exec",
      argv: ["argv0"],
    },
  );
}

{
  const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  global.GLOBAL_PROMPTS = () => {
    global.GLOBAL_PROMPTS = () => {
      assertFail();
    };
    return { answer: false };
  };
  const { packages } = await bootBatchAsync({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: [],
    cwd,
  });
  assertEqual(packages.length, 4);
}

{
  const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  const iterator = [
    { answer: true },
    { value: { app: "app" } },
    {},
    { answer: true },
  ][Symbol.iterator]();
  global.GLOBAL_PROMPTS = () => {
    const { done, value } = iterator.next();
    assertEqual(done, false);
    return value;
  };
  const { app } = await bootBatchAsync({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: [],
    cwd,
  });
  assertEqual(iterator.next().done, true);
  assertEqual(app, "app");
  assertDeepEqual(YAML.parse(await readFile(path, "utf8")), { app: "app" });
}

///////////////////////////
// bootAutomatedRecorder //
///////////////////////////

{
  const configuration = createConfiguration("/repository");
  assertDeepEqual(
    extendConfiguration(configuration, { main: "main.mjs" }, "/cwd"),
    bootEmptyRecorder({
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
    const { app } = await bootManualRecorderAsync("/home", path, "/base");
    assertEqual(app, "app");
  }
  {
    const { app } = bootManualRecorder("/home", path, "/base");
    assertEqual(app, "app");
  }
}
