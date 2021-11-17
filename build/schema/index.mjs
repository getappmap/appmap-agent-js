import { readFile as readFileAsync, writeFile as writeFileAsync, mkdir as mkdirAsync } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname as getDirname } from "path";
import YAML from "yaml";
import Ajv from "ajv";
import GenerateStandaloneCode from "ajv/dist/standalone/index.js";
import { spawn } from "child_process";

const { default: generateStandaloneCode } = GenerateStandaloneCode;

const { stringify: stringifyJSON } = JSON;
const { parse: parseYAML } = YAML;

const __filename = fileURLToPath(import.meta.url);
const __dirname = getDirname(__filename);

await new Promise((resolve, reject) => {
  const child = spawn("rm", ["-rf", "./dist"], {stdio:"inherit"});
  child.on("error", reject);
  child.on("exit", (code, signal) => {
    if (signal !== null) {
      reject(new Error("Removing dist directory killed"));
    } else if (code !== 0) {
      reject(new Error("Failed to remove dist directory"));
    } else {
      resolve(undefined);
    }
  });
});

await mkdirAsync("./dist");

await mkdirAsync("./dist/node");

const schema = parseYAML(await readFileAsync(`${__dirname}/schema.yml`, "utf8"));

const ajv = new Ajv({ code: { source: true }, verbose: true });
// {code:{source:true}, verbose:true}
ajv.addSchema(schema);
generateStandaloneCode(ajv);

await writeFileAsync(
  `${__dirname}/../../dist/schema.mjs`,
  `export const schema = ${stringifyJSON(schema, null, 2)};`,
  "utf8",
);
