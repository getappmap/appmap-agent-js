import util$default from "./../../components/util/default/index.mjs";
import violation$exit from "./../../components/violation/exit/index.mjs";
import expect_inner$default from "./../../components/expect-inner/default/index.mjs";
import expect$default from "./../../components/expect/default/index.mjs";
import validate_mocha$default from "./../../components/validate-mocha/default/index.mjs";

export default (blueprint) => {
  const dependencies = { __proto__: null };
  dependencies["util"] = util$default(dependencies);
  dependencies["violation"] = violation$exit(dependencies);
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["validate-mocha"] = validate_mocha$default(dependencies);
  return dependencies["validate-mocha"];
};
