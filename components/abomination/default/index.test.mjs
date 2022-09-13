import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
  symlink as symlinkAsync,
  readlink as readLinkAsync,
} from "fs/promises";
import { fileURLToPath } from "url";
import { buildTestDependenciesAsync } from "../../build.mjs";
import { getFreshTemporaryURL, assertEqual } from "../../__fixture__.mjs";
import { basename as getBasename } from "path";
import Abomination from "./index.mjs";

const { addLinkExtensionAsync } = Abomination(
  await buildTestDependenciesAsync(import.meta.url),
);

const path1 = fileURLToPath(getFreshTemporaryURL());
const path2 = fileURLToPath(getFreshTemporaryURL());

await writeFileAsync(path1, "123;", "utf8");
await symlinkAsync(getBasename(path1), path2, "file");

await addLinkExtensionAsync(path2);
assertEqual(await readLinkAsync(path2), `${getBasename(path1)}.cjs`);
assertEqual(await readFileAsync(`${path1}.cjs`, "utf8"), "123;");

await addLinkExtensionAsync(`${path1}.cjs`);