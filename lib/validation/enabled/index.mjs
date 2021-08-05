import * as Path from "path";
import * as FileSystem from "fs";
import YAML from "yaml";
import Ajv from "ajv";
import Treeify from "treeify";
import AjvErrorTree from "ajv-error-tree";
import { assert } from "./assert.mjs";
import { Left, Right } from "./either.mjs";
import { logger } from "./logger.mjs";
import { home } from "../home.js";

const ajv = new Ajv({ verbose: true });
ajv.addSchema(
  YAML.parse(
    FileSystem.readFileSync(Path.resolve(home, "src", "schema.yml"), "utf8"),
  ),
);
const validateRequestSchema = ajv.getSchema("request");
const validateConfigurationSchema = ajv.getSchema("configuration");

const makeValidate = (name, callback) => (json) => {
  if (!callback(json)) {
    logger.warning(`invalid json for schema %s: %j`, name, callback.errors);
    assert(callback.errors.length > 0, `unexpected empty error array`);
    return new Left(
      Treeify.asTree(
        AjvErrorTree.summarizeAJVErrorTree(
          AjvErrorTree.structureAJVErrorArray(callback.errors),
        ),
        true,
      ),
    );
  }
  return new Right(json);
};

export const validateRequest = makeValidate("request", validateRequestSchema);

export const validateConfiguration = makeValidate(
  "configuration",
  validateConfigurationSchema,
);
