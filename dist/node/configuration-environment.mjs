import util$default from "./../../components/util/default/index.mjs";
import violation$exit from "./../../components/violation/exit/index.mjs";
import expect_inner$default from "./../../components/expect-inner/default/index.mjs";
import expect$default from "./../../components/expect/default/index.mjs";
import validate$ajv from "./../../components/validate/ajv/index.mjs";
import configuration_environment$default from "./../../components/configuration-environment/default/index.mjs";

export default (blueprint) => {
  const dependencies = { __proto__: null };
  dependencies["util"] = util$default(dependencies);
  dependencies["violation"] = violation$exit(dependencies);
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["validate"] = validate$ajv(dependencies);
  dependencies["configuration-environment"] =
    configuration_environment$default(dependencies);
  return dependencies["configuration-environment"];
};
