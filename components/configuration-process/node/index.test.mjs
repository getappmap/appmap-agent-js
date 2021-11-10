import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import ConfigurationProcess from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  // fail: assertFail,
  // equal: assertEqual,
} = Assert;

const { loadProcessConfiguration } = ConfigurationProcess(
  await buildTestDependenciesAsync(import.meta.url),
);

{
  const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}.json`;
  loadProcessConfiguration({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: ["node", "main.mjs"],
    cwd: () => "/cwd",
  });
  await writeFile(
    path,
    JSON.stringify({ name: "app", "map-name": "name1" }),
    "utf8",
  );
  const {
    name: app_name,
    "map-name": map_name,
    command,
    log,
  } = loadProcessConfiguration({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: [
      "node",
      "agent.mjs",
      "--log-level",
      "error",
      "--map-name",
      "name2",
      "--command",
      "command1",
      "--",
      "command2",
    ],
    cwd: () => "/cwd",
  });
  assertDeepEqual(
    { app_name, map_name, command, log },
    {
      app_name: "app",
      log: "error",
      map_name: "name2",
      command: {
        value: "'command2'",
        cwd: "/cwd",
      },
    },
  );
}
