import YAML from "yaml";
import Ajv from "ajv";
import { readFile } from "fs/promises";
import { assert } from "./assert.mjs";
import { expect } from "./expect.mjs";

const { parse: parseYAML } = YAML;

const ajv = new Ajv();

const names = {
  type: "array",
  uniqueItems: true,
  items: {
    type: "string",
    pattern: "^[1-9A-Za-z\\-]+$",
  },
};

const validateSchema = ajv.compile({
  type: "object",
  additionalProperties: false,
  required: ["branches", "dependencies"],
  properties: {
    branches: names,
    dependencies: names,
  },
});

const readConfAsync = async (path) => {
  try {
    return parseYAML(await readFile(path, "utf8"));
  } catch ({ message }) {
    throw expect(
      false,
      "failed to load configuration file from %j >> %s",
      path,
      message,
    );
  }
};

const validateConf = (conf, path) => {
  if (!validateSchema(conf)) {
    const { length } = validateSchema.errors;
    assert(length > 0, "missing ajv error");
    const [{ message }] = validateSchema.errors;
    expect(false, "invalid configuration file at %j: %s", path, message);
  }
};

export const loadConfAsync = async (path) => {
  const conf = await readConfAsync(path);
  validateConf(conf, path);
  return conf;
};
