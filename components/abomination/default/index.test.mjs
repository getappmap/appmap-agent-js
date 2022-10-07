import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
  symlink as symlinkAsync,
  readlink as readLinkAsync,
} from "fs/promises";
import { fileURLToPath } from "url";
import { getFreshTemporaryURL, assertEqual } from "../../__fixture__.mjs";
import { basename as getBasename } from "path";
import { addLinkExtensionAsync } from "./index.mjs?env=test";

const path1 = fileURLToPath(getFreshTemporaryURL());
const path2 = fileURLToPath(getFreshTemporaryURL());

await writeFileAsync(path1, "123;", "utf8");
await symlinkAsync(getBasename(path1), path2, "file");

await addLinkExtensionAsync(path2);
assertEqual(await readLinkAsync(path2), `${getBasename(path1)}.cjs`);
assertEqual(await readFileAsync(`${path1}.cjs`, "utf8"), "123;");

await addLinkExtensionAsync(`${path1}.cjs`);
