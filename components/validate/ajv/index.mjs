const { URL, Map } = globalThis;

const { search: __search } = new URL(import.meta.url);

import Ajv from "ajv";
import Treeify from "treeify";
import AjvErrorTree from "ajv-error-tree";
const { schema } = await import(`../../../dist/schema.mjs${__search}`);
const { assert, coalesce } = await import(`../../util/index.mjs${__search}`);
const { expect } = await import(`../../expect/index.mjs${__search}`);

const { asTree } = Treeify;

const naming = new Map([
  ["serial", "serial"],
  ["payload", "payload"],
  ["external-configuration", "user-defined configuration"],
  ["internal-configuration", "internal configuration"],
  ["message", "message"],
  ["source-map", "source-map"],
]);

const ajv = new Ajv({ verbose: true });

ajv.addSchema(schema);

const generateValidate = (name) => {
  const validateSchema = ajv.getSchema(name);
  return (json) => {
    if (!validateSchema(json)) {
      const { errors } = validateSchema;
      const { length } = errors;
      assert(length > 0, "unexpected empty error array");
      const tree1 = AjvErrorTree.structureAJVErrorArray(errors);
      const tree2 = AjvErrorTree.summarizeAJVErrorTree(tree1);
      expect(
        false,
        "invalid %s\n%s\n  Parameters = %j\n  Input = %j",
        naming.get(name),
        typeof tree2 === "string" ? tree2 : asTree(tree2, true),
        errors.map((error) => coalesce(error, "params", null)),
        json,
      );
    }
  };
};

export const validateSerial = generateValidate("serial");

export const validateMessage = generateValidate("message");

export const validatePayload = generateValidate("payload");

export const validateExternalConfiguration = generateValidate(
  "external-configuration",
);

export const validateInternalConfiguration = generateValidate(
  "internal-configuration",
);

export const validateSourceMap = generateValidate("source-map");
