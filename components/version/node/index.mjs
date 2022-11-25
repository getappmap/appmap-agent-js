const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

import { readFile as readFileAsync } from "node:fs/promises";
import { home } from "../../home/index.mjs";

export const { version } = parseJSON(
  await readFileAsync(new URL("package.json", home)),
);
