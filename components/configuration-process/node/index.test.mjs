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
  const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  loadProcessConfiguration({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: ["node", "main.mjs"],
    cwd: () => "/cwd",
  });
  await writeFile(path, "app: app", "utf8");
  const { app, name, command } = loadProcessConfiguration({
    env: { APPMAP_CONFIGURATION_PATH: path },
    argv: ["node", "agent.mjs", "--name", "name", "--", "node", "main.mjs"],
    cwd: () => "/cwd",
  });
  assertDeepEqual(
    { app, name, command },
    {
      app: "app",
      name: "name",
      command: {
        value: "'node' 'main.mjs'",
        cwd: "/cwd",
      },
    },
  );
}
