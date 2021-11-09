import util$default from "./../../components/util/default/index.mjs";
import violation$error from "./../../components/violation/error/index.mjs";
import expect_inner$default from "./../../components/expect-inner/default/index.mjs";
import expect$default from "./../../components/expect/default/index.mjs";
import validate$ajv from "./../../components/validate/ajv/index.mjs";
import specifier$default from "./../../components/specifier/default/index.mjs";
import configuration$default from "./../../components/configuration/default/index.mjs";

export default (blueprint) => {
  const dependencies = { __proto__: null };
  dependencies["util"] = util$default(dependencies);
  dependencies["violation"] = violation$error(dependencies);
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["validate"] = validate$ajv(dependencies);
  dependencies["specifier"] = specifier$default(dependencies);
  dependencies["configuration"] = configuration$default(dependencies);
  return dependencies["configuration"];
};
