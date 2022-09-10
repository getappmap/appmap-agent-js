import { fileURLToPath } from "url";
import { platform as getPlatform } from "os";
import { join as joinPath, relative as getRelativePath } from "path";
import {
  symlink as symlinkAsync,
  mkdir as mkdirAsync,
  rm as rmAsync,
  writeFile as writeFileAsync,
} from "fs/promises";
import { assertEqual, getFreshTemporaryURL } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Setup from "./index.mjs";

const {
  URL,
  process,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { mainAsync } = Setup(dependencies);

const directory = getFreshTemporaryURL();
const cwd = () => fileURLToPath(directory);
await mkdirAsync(new URL(directory));

assertEqual(await mainAsync({ ...process, version: "v12.34.56" }), false);
process.stdout.write("\n");

globalThis.GLOBAL_PROMPTS = () => ({ value: false });

assertEqual(
  await mainAsync({
    ...process,
    env: {
      APPMAP_CONFIGURATION_PATH: fileURLToPath(`${directory}/appmap.yml`),
      APPMAP_REPOSITORY_DIRECTORY: fileURLToPath(directory),
    },
  }),
  false,
);
process.stdout.write("\n");

await writeFileAsync(
  new URL(`${directory}/appmap.yml`),
  "{invalid ,, yaml}",
  "utf8",
);
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await writeFileAsync(
  new URL(`${directory}/appmap.yml`),
  "invalid configuration type",
  "utf8",
);
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await writeFileAsync(
  new URL(`${directory}/appmap.yml`),
  "name: my-name",
  "utf8",
);
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await mkdirAsync(new URL(`${directory}/node_modules`));
await mkdirAsync(new URL(`${directory}/node_modules/@appland`));

await mkdirAsync(new URL(`${directory}/node_modules/@appland/appmap-agent-js`));
await writeFileAsync(
  new URL(`${directory}/node_modules/@appland/appmap-agent-js/package.json`),
  stringifyJSON({
    name: "@appland/appmap-agent-js",
    version: "1.2.3",
  }),
  "utf8",
);
await writeFileAsync(
  new URL(`${directory}/node_modules/@appland/appmap-agent-js/index.js`),
  "123;",
  "utf8",
);
// TODO investigate how to clear resolve cache which cause next test to fail.
// assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

const url = new URL(`${directory}/node_modules/@appland/appmap-agent-js`);
await rmAsync(url, { recursive: true });
await symlinkAsync(
  getRelativePath(
    fileURLToPath(url),
    joinPath(fileURLToPath(import.meta.url), "..", "..", "..", ".."),
  ),
  url,
  "dir",
);
// TODO: investigate why symlink resolution in windows does not work
if (getPlatform() !== "win32") {
  assertEqual(await mainAsync({ ...process, cwd }), true);
}
process.stdout.write("\n");

await mkdirAsync(new URL(`${directory}/.git`));
await writeFileAsync(new URL(`${directory}/package.json`), "{}", "utf8");
// TODO: investigate why symlink resolution in windows does not work
if (getPlatform() !== "win32") {
  assertEqual(await mainAsync({ ...process, cwd }), true);
}
process.stdout.write("\n");
