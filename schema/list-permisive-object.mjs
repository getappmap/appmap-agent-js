import { stdout } from "node:process";
import {
  readdir as readdirAsync,
  readFile as readFileAsync,
} from "node:fs/promises";

const { String, URL } = globalThis;

const { url } = import.meta;

for (const filename of await readdirAsync(new URL("definitions", url))) {
  (await readFileAsync(new URL(`definitions/${filename}`, url), "utf8"))
    .split("\n")
    .forEach((line, index, lines) => {
      if (/type:\s*object/u.test(line)) {
        if (
          index + 1 >= lines.length ||
          !/additionalProperties:\s*false/u.test(lines[index + 1])
        ) {
          stdout.write(`${filename}:${String(index + 1)}\n`);
        }
      }
    });
}
