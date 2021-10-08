import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { mkdir, writeFile, symlink } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Setup from "./index.mjs";

const { equal: assertEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { mainAsync } = Setup(dependencies);

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
const cwd = () => directory;
await mkdir(directory);

assertEqual(await mainAsync({ ...process, platform: "win32" }), false);
process.stdout.write("\n");

assertEqual(await mainAsync({ ...process, version: "v12.34.56" }), false);
process.stdout.write("\n");

global.GLOBAL_PROMPTS = () => ({ value: false });

assertEqual(
  await mainAsync({
    ...process,
    env: {
      APPMAP_CONFIGURATION_PATH: `${directory}/appmap.yml`,
      APPMAP_REPOSITORY_DIRECTORY: directory,
    },
  }),
  false,
);
process.stdout.write("\n");

await writeFile(`${directory}/appmap.yml`, "{invalid ,, yaml}", "utf8");
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await writeFile(`${directory}/appmap.yml`, "{valid: yaml}", "utf8");
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await writeFile(`${directory}/appmap.yml`, "name: my-name", "utf8");
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await mkdir(`${directory}/node_modules`);
await mkdir(`${directory}/node_modules/@appland`);
await symlink(
  process.cwd(),
  `${directory}/node_modules/@appland/appmap-agent-js`,
);
assertEqual(await mainAsync({ ...process, cwd }), true);
process.stdout.write("\n");

await mkdir(`${directory}/.git`);
await writeFile(`${directory}/package.json`, "{}", "utf8");
assertEqual(await mainAsync({ ...process, cwd }), true);
process.stdout.write("\n");
