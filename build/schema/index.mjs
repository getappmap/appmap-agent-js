import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "fs/promises";
import YAML from "yaml";

const {
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { parse: parseYAML } = YAML;

const { url } = import.meta;

const schema = parseYAML(
  await readFileAsync(new URL("schema.yml", url), "utf8"),
);

await writeFileAsync(
  new URL("../../dist/schema.mjs", url),
  `export const schema = ${stringifyJSON(schema, null, 2)};`,
  "utf8",
);
