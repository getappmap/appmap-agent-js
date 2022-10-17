import { writeFile as writeFileAsync } from "fs/promises";

import {
  assertThrow,
  assertDeepEqual,
  assertEqual,
} from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { getTmpPath, getTmpUrl } from "../../path/index.mjs?env=test";
import { loadProcessConfiguration } from "./index.mjs?env=test";

const {
  URL,
  JSON: { stringify: stringifyJSON },
  Reflect: { get },
} = globalThis;

assertThrow(
  () =>
    loadProcessConfiguration({
      env: { APPMAP_CONFIGURATION_PATH: getUuid() },
      argv: ["node", "main.mjs"],
      cwd: getTmpPath,
    }),
  /^AppmapError: Unsupported configuration file extension/u,
);

{
  const filename = `${getUuid()}.json`;
  loadProcessConfiguration({
    env: { APPMAP_CONFIGURATION_PATH: filename },
    argv: ["node", "main.mjs"],
    cwd: getTmpPath,
  });
  await writeFileAsync(
    new URL(filename, getTmpUrl()),
    stringifyJSON({ name: "app", "map-name": "name1" }),
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
    env: { APPMAP_CONFIGURATION_PATH: filename },
    argv: [
      ["node", "agent.mjs"],
      ["--track-port", "8080"],
      ["--log-level", "warning"],
      ["--log-file", "1"],
      ["--map-name", "name2"],
      ["--packages", "'lib/*.js'"],
      ["--package", "'test/*.js'"],
      ["--process", "'*'"],
      ["--", "exec", "arg1", "arg2"],
    ].flat(),
    cwd: getTmpPath,
  });
  assertEqual(packages.length, 5);
  assertEqual(processes.length, 2);
  assertDeepEqual(
    { app_name, map_name, command, log, track_port },
    {
      track_port: 8080,
      app_name: "app",
      log: {
        level: "warning",
        file: 1,
      },
      map_name: "name2",
      command: {
        script: null,
        tokens: ["exec", "arg1", "arg2"],
        base: getTmpUrl(),
      },
    },
  );
}

assertDeepEqual(
  get(
    loadProcessConfiguration({
      env: {
        APPMAP_CONFIGURATION_PATH: `${getUuid()}.json`,
      },
      argv: [
        ["node", "agent.mjs"],
        ["--command", "exec arg1 arg2"],
      ].flat(),
      cwd: getTmpPath,
    }),
    "command",
  ),
  {
    script: "exec arg1 arg2",
    tokens: null,
    base: getTmpUrl(),
  },
);
