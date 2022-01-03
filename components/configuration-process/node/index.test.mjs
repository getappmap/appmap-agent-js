import { writeFile as writeFileAsync } from "fs/promises";
import { fileURLToPath } from "url";
import {
  assertThrow,
  assertDeepEqual,
  assertEqual,
  getFreshTemporaryURL,
} from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import ConfigurationProcess from "./index.mjs";

const { loadProcessConfiguration } = ConfigurationProcess(
  await buildTestDependenciesAsync(import.meta.url),
);

assertThrow(
  () =>
    loadProcessConfiguration({
      env: { APPMAP_CONFIGURATION_PATH: "foo" },
      argv: ["node", "main.mjs"],
      cwd: () => "cwd",
    }),
  /^AppmapError: Unsupported configuration file extension/,
);

{
  const url = getFreshTemporaryURL(".json");
  loadProcessConfiguration({
    env: { APPMAP_CONFIGURATION_PATH: fileURLToPath(url) },
    argv: ["node", "main.mjs"],
    cwd: () => "cwd",
  });
  await writeFileAsync(
    new URL(url),
    JSON.stringify({ name: "app", "map-name": "name1" }),
    "utf8",
  );
  const {
    name: app_name,
    "map-name": map_name,
    command,
    packages,
    processes,
    log,
    "track-port": track_port,
  } = loadProcessConfiguration({
    env: { APPMAP_CONFIGURATION_PATH: fileURLToPath(url) },
    argv: [
      ["node", "agent.mjs"],
      ["--track-port", "8080"],
      ["--log-level", "error"],
      ["--map-name", "name2"],
      ["--packages", "'lib/*.js'"],
      ["--package", "'test/*.js'"],
      ["--process", "'*'"],
      ["--", "exec", "arg1", "arg2"],
    ].flat(),
    cwd: () => "cwd",
  });
  assertEqual(packages.length, 3);
  assertEqual(processes.length, 2);
  assertDeepEqual(
    { app_name, map_name, command, log, track_port },
    {
      track_port: 8080,
      app_name: "app",
      log: "error",
      map_name: "name2",
      command: {
        exec: "exec",
        argv: ["arg1", "arg2"],
        base: "file:///cwd",
      },
    },
  );
}

assertDeepEqual(
  Reflect.get(
    loadProcessConfiguration({
      env: {
        APPMAP_CONFIGURATION_PATH: fileURLToPath(getFreshTemporaryURL(".json")),
      },
      argv: [
        ["node", "agent.mjs"],
        ["--command", "exec arg1 arg2"],
      ].flat(),
      cwd: () => "cwd",
    }),
    "command",
  ),
  {
    exec: "exec",
    argv: ["arg1", "arg2"],
    base: "file:///cwd",
  },
);
