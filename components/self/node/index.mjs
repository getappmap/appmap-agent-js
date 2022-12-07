// Consistent way to retreive home url in prod and test.
// Indeed, components are bundled and import.meta.url will be in dist at prod.
// However both test and prod import.meta.url are inside home.

import { readFile as readFileAsync } from "node:fs/promises";
import { toAbsoluteUrl } from "../../url/index.mjs";

const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

let url = toAbsoluteUrl(".", import.meta.url);

while (!url.endsWith("appmap-agent-js/")) {
  url = toAbsoluteUrl("..", url);
}

export const self_directory = url;

export const self_package = parseJSON(
  await readFileAsync(
    new URL(toAbsoluteUrl("package.json", self_directory)),
    "utf8",
  ),
);
