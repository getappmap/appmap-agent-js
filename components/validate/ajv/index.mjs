import Ajv from "ajv";
import Treeify from "treeify";
import AjvErrorTree from "ajv-error-tree";
import { schema } from "../../../dist/schema.mjs";

const _Map = Map;
const { asTree } = Treeify;

export default (dependencies) => {
  const {
    util: { assert, coalesce },
    expect: { expect },
  } = dependencies;
  const naming = new _Map([
    ["config", "configuration"],
    ["configuration", "cooked-configuration"],
    ["message", "message"],
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
  return {
    validateMessage: generateValidate("message"),
    validateConfig: generateValidate("config"),
    validateConfiguration: generateValidate("configuration"),
    validateSourceMap: generateValidate("source-map"),
  };
};
