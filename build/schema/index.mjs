import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "fs/promises";
import { fileURLToPath } from "url";
import { dirname as getDirectory } from "path";
import YAML from "yaml";
import Ajv from "ajv";
import GenerateStandaloneCode from "ajv/dist/standalone/index.js";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { default: generateStandaloneCode } = GenerateStandaloneCode;
const { parse: parseYAML } = YAML;

const __filename = fileURLToPath(import.meta.url);
const __dirname = getDirectory(__filename);

const schema = parseYAML(
  await readFileAsync(`${__dirname}/schema.yml`, "utf8"),
);

const ajv = new Ajv({ code: { source: true }, verbose: true });
// {code:{source:true}, verbose:true}
ajv.addSchema(schema);
generateStandaloneCode(ajv);

await writeFileAsync(
  `${__dirname}/../../dist/schema.mjs`,
  `export const schema = ${stringifyJSON(schema, null, 2)};`,
  "utf8",
);