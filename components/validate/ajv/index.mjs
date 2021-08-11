import Ajv from "ajv";
import Treeify from "treeify";
import AjvErrorTree from "ajv-error-tree";
import { schema } from "../../../dist/schema.mjs";

const { asTree } = Treeify;

export default (dependencies) => {
  const {
    util: { assert },
    expect: { expect },
  } = dependencies;
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
        // console.log(tree1);
        const tree2 = AjvErrorTree.summarizeAJVErrorTree(tree1);
        if (typeof tree2 === "string") {
          expect(false, "invalid %s >> %s\n%j", name, tree2, json);
        } else {
          expect(false, "invalid %s\n%s\n%j", name, asTree(tree2, true), json);
        }
      }
    };
  };
  return {
    validateMessage: generateValidate("message"),
    validateConfiguration: generateValidate("configuration"),
    validateCookedConfiguration: generateValidate("cooked-configuration"),
  };
};
