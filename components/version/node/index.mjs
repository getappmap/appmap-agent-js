import { readFile as readFileAsync } from "node:fs/promises";
import { home } from "../../home/index.mjs";

const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

export const { version } = parseJSON(
  await readFileAsync(new URL("package.json", home)),
);
