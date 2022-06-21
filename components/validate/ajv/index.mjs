import Ajv from "ajv";
import Treeify from "treeify";
import AjvErrorTree from "ajv-error-tree";
import { schema } from "../../../dist/schema.mjs";

const { ownKeys } = Reflect;
const _Map = Map;
const { asTree } = Treeify;

const expected_extra_properties = ["appmap_dir", "test_recording"];

export default (dependencies) => {
  const {
    util: { hasOwnProperty, assert, coalesce },
    expect: { expect },
    log: { logGuardInfo },
  } = dependencies;
  const naming = new _Map([
    ["config", "configuration"],
    ["configuration", "cooked-configuration"],
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
  const validateConfig = generateValidate("config");
  const config_schema = schema.find(({ $id }) => $id === "config");
  return {
    validateMessage: generateValidate("message"),
    validateConfig: (config) => {
      validateConfig(config);
      for (const key of ownKeys(config)) {
        logGuardInfo(
          !hasOwnProperty(config_schema.properties, key) &&
            expected_extra_properties.includes(key),
          "Configuration property not recognized by the agent: %j",
          key,
        );
      }
    },
    validateConfiguration: generateValidate("configuration"),
    validateSourceMap: generateValidate("source-map"),
  };
};
