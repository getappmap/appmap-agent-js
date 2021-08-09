import Ajv from "ajv";
import Treeify from "treeify";
import AjvErrorTree from "ajv-error-tree";
import { schema } from "../../../schema/index.mjs";

const { asTree } = Treeify;

export default (dependencies) => {
  const {
    util: { assert },
    expect: { expect },
  } = dependencies;
  const ajv = new Ajv({ verbose: true });
  ajv.addSchema(schema);
  const validateMessageSchema = ajv.getSchema("message");
  const validateConfigurationSchema = ajv.getSchema("configuration");
  const makeValidate = (name, validateSchema) => (json) => {
    if (!validateSchema(json)) {
      const { errors } = validateSchema;
      const { length } = errors;
      assert(length > 0, "unexpected empty error array");
      const tree1 = AjvErrorTree.structureAJVErrorArray(errors);
      // console.log(tree1);
      const tree2 = AjvErrorTree.summarizeAJVErrorTree(tree1);
      if (typeof tree2 === "string") {
        expect(false, "invalid %s >> %s", name, tree2);
      } else {
        expect(false, "invalid %s\n%s", name, asTree(tree2, true));
      }
    }
  };

  return {
    validateMessage: makeValidate("message", validateMessageSchema),
    validateConfiguration: makeValidate(
      "configuration",
      validateConfigurationSchema,
    ),
  };
};
