import { readFile as readFileAsync} from "fs/promises";
import {fileURLToPath as toPath} from "url";
import {dirname as getDirectory, join as joinPath} from "path";

const {parse: parseJSON} = JSON;

const {name, version} = parseJSON(
  await readFileAsync(
    joinPath(getDirectory(toPath(import.meta.url)), "..", "..", "package.json"),
    "utf8",
  )
);

process.stdout.write(`${name}@${version}${"\n"}`);
