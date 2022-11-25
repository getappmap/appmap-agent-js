import {
  realpath as realpathAsync,
  mkdir as mkdirAsync,
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { getUuid } from "../../uuid/random/index.mjs";
import {
  toDirectoryPath,
  getTmpUrl,
  convertFileUrlToPath,
  convertPathToFileUrl,
} from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { assertEqual } from "../../__fixture__.mjs";

import { mainAsync } from "./index.mjs";

const { URL, process } = globalThis;

globalThis.GLOBAL_PROMPTS = () => ({ value: false });

const base = toAbsoluteUrl(`${getUuid()}/`, getTmpUrl());

const cwd = () => convertFileUrlToPath(base);

await mkdirAsync(new URL(base));

assertEqual(await mainAsync({ ...process, version: "v12.34.56" }), false);
process.stdout.write("\n");

assertEqual(
  await mainAsync({
    ...process,
    cwd,
    env: {
      APPMAP_CONFIGURATION_PATH: "appmap.yml",
      APPMAP_REPOSITORY_DIRECTORY: ".",
    },
  }),
  false,
);
process.stdout.write("\n");

await writeFileAsync(new URL("appmap.yml", base), "{invalid ,, yaml}", "utf8");
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await writeFileAsync(
  new URL("appmap.yml", base),
  "invalid configuration type",
  "utf8",
);
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await writeFileAsync(new URL("appmap.yml", base), "name: my-name", "utf8");
assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

await mkdirAsync(new URL("node_modules/", base));
await mkdirAsync(new URL("node_modules/@appland/", base));
await mkdirAsync(new URL("node_modules/@appland/appmap-agent-js/", base));
await mkdirAsync(new URL("node_modules/@appland/appmap-agent-js/lib/", base));
await mkdirAsync(
  new URL("node_modules/@appland/appmap-agent-js/lib/node", base),
);
await writeFileAsync(
  new URL("node_modules/@appland/appmap-agent-js/package.json", base),
  await readFileAsync(
    new URL("../../../package.json", import.meta.url),
    "utf8",
  ),
  "utf8",
);
await writeFileAsync(
  new URL(
    "node_modules/@appland/appmap-agent-js/lib/node/recorder-api.mjs",
    base,
  ),
  "123;",
  "utf8",
);

assertEqual(await mainAsync({ ...process, cwd }), false);
process.stdout.write("\n");

const fake = toAbsoluteUrl(
  "node_modules/@appland/appmap-agent-js/",
  convertPathToFileUrl(toDirectoryPath(await realpathAsync(new URL(base)))),
);

assertEqual(await mainAsync({ ...process, cwd }, fake), true);
process.stdout.write("\n");

await mkdirAsync(new URL(".git", base));
await writeFileAsync(new URL("package.json", base), "{}", "utf8");

assertEqual(await mainAsync({ ...process, cwd }, fake), true);
process.stdout.write("\n");
