const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

import { readFile as readFileAsync } from "node:fs/promises";

export const { version } = parseJSON(
  await readFileAsync(new URL("../../../package.json", import.meta.url)),
);
