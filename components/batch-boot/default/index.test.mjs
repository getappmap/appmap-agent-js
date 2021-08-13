import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import BatchBoot from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const { loadConfiguration } = BatchBoot(
  await buildTestDependenciesAsync(import.meta.url),
);

const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
await writeFile(path, "app: app", "utf8");

const { cwd } = process;

const {
  mode,
  app,
  name,
  scenarios: {
    anonymous: [{ exec, argv }],
  },
} = loadConfiguration({
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
