import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
  symlink as symlinkAsync,
  readlink as readLinkAsync,
} from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import Abomination from "./index.mjs";

const { equal: assertEqual } = Assert;

const { addLinkExtensionAsync } = Abomination(
  await buildTestDependenciesAsync(import.meta.url),
);

const filename1 = Math.random().toString(36).substring(2);
const filename2 = Math.random().toString(36).substring(2);

await writeFileAsync(`${tmpdir()}/${filename1}`, "123;", "utf8");
await symlinkAsync(filename1, `${tmpdir()}/${filename2}`);

await addLinkExtensionAsync(`${tmpdir()}/${filename2}`);
assertEqual(
  await readLinkAsync(`${tmpdir()}/${filename2}`),
  `${filename1}.cjs`,
);
assertEqual(
  await readFileAsync(`${tmpdir()}/${filename1}.cjs`, "utf8"),
  "123;",
);

await addLinkExtensionAsync(`${tmpdir()}/${filename1}.cjs`);
