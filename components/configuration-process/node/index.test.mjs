import { writeFile as writeFileAsync } from "node:fs/promises";

import {
  assertThrow,
  assertDeepEqual,
  assertEqual,
} from "../../__fixture__.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpPath, getTmpUrl } from "../../path/index.mjs";
import { getConfigurationPackage } from "../../configuration-accessor/index.mjs";
import { loadProcessConfiguration } from "./index.mjs";

const {
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

assertThrow(
  () =>
    loadProcessConfiguration({
      env: { APPMAP_CONFIGURATION_PATH: getUuid() },
      argv: ["node", "main.mjs"],
      cwd: getTmpPath,
    }),
  /^ExternalAppmapError: Unsupported configuration file extension$/u,
);

// present configuration file //
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
  assertEqual(packages.length, 2);
  assertEqual(processes.length, 1);
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
        source: null,
        tokens: ["exec", "arg1", "arg2"],
      },
    },
  );
}

// invalid configuration file //
{
  const filename = `${getUuid()}.json`;
  loadProcessConfiguration({
    env: { APPMAP_CONFIGURATION_PATH: filename },
    argv: ["node", "main.mjs"],
    cwd: getTmpPath,
  });
  await writeFileAsync(new URL(filename, getTmpUrl()), "INVALID JSON", "utf8");
  assertThrow(
    () =>
      loadProcessConfiguration({
        env: { APPMAP_CONFIGURATION_PATH: filename },
        argv: [],
        cwd: getTmpPath,
      }),
    /^ExternalAppmapError: Failed to parse configuration file$/u,
  );
}

// missing configuration file && rest command //
{
  const configuration = loadProcessConfiguration({
    env: {
      APPMAP_CONFIGURATION_PATH: `${getUuid()}.json`,
    },
    argv: [
      ["node", "agent.mjs"],
      ["--command", "exec arg1 arg2"],
    ].flat(),
    cwd: getTmpPath,
  });
  assertDeepEqual(configuration.command, {
    source: "exec arg1 arg2",
    tokens: null,
  });
  assertDeepEqual(
    getConfigurationPackage(
      configuration,
      toAbsoluteUrl("package.js", getTmpUrl()),
    ),
    {
      enabled: true,
      shallow: false,
      exclude: [],
      "inline-source": null,
    },
  );
  assertDeepEqual(
    getConfigurationPackage(
      configuration,
      toAbsoluteUrl("../package.js", getTmpUrl()),
    ),
    {
      enabled: false,
      shallow: false,
      exclude: [],
      "inline-source": null,
    },
  );
  assertDeepEqual(
    getConfigurationPackage(
      configuration,
      toAbsoluteUrl("node_modules/package.js", getTmpUrl()),
    ),
    {
      enabled: false,
      shallow: false,
      exclude: [],
      "inline-source": null,
    },
  );
}
