import {readFileSync, writeFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname as getDirname} from "path";
import YAML from "yaml";
import Ajv from "ajv";
import GenerateStandaloneCode from "ajv/dist/standalone/index.js";
const {default:generateStandaloneCode} = GenerateStandaloneCode;

const {stringify:stringifyJSON} = JSON;
const {parse:parseYAML} = YAML;

const __filename = fileURLToPath(import.meta.url);
const __dirname = getDirname(__filename);

const schema = parseYAML(readFileSync(`${__dirname}/schema.yml`, "utf8"));

const ajv = new Ajv({code:{source:true}, verbose:true});
// {code:{source:true}, verbose:true}
ajv.addSchema(schema);
generateStandaloneCode(ajv);

writeFileSync(
  `${__dirname}/../../dist/schema.mjs`,
  `export const schema = ${stringifyJSON(schema, null, 2)};`,
  "utf8",
);
