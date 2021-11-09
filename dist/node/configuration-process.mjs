import util$default from "./../../components/util/default/index.mjs";
import violation$exit from "./../../components/violation/exit/index.mjs";
import expect_inner$default from "./../../components/expect-inner/default/index.mjs";
import expect$default from "./../../components/expect/default/index.mjs";
import validate$ajv from "./../../components/validate/ajv/index.mjs";
import specifier$default from "./../../components/specifier/default/index.mjs";
import configuration$default from "./../../components/configuration/default/index.mjs";
import configuration_process$node from "./../../components/configuration-process/node/index.mjs";

export default (blueprint) => {
  const dependencies = { __proto__: null };
  dependencies["util"] = util$default(dependencies);
  dependencies["violation"] = violation$exit(dependencies);
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["validate"] = validate$ajv(dependencies);
  dependencies["specifier"] = specifier$default(dependencies);
  dependencies["configuration"] = configuration$default(dependencies);
  dependencies["configuration-process"] =
    configuration_process$node(dependencies);
  return dependencies["configuration-process"];
};
