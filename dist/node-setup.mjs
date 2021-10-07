import prompts$node from "./../components/prompts/node/index.mjs";
import util$default from "./../components/util/default/index.mjs";
import questionnaire$node from "./../components/questionnaire/node/index.mjs";
import violation$error from "./../components/violation/error/index.mjs";
import expect_inner$default from "./../components/expect-inner/default/index.mjs";
import expect$default from "./../components/expect/default/index.mjs";
import validate$ajv from "./../components/validate/ajv/index.mjs";
import setup$node from "./../components/setup/node/index.mjs";

export default (blueprint) => {
  const dependencies = {__proto__:null};
  dependencies["prompts"] = prompts$node(dependencies);
  dependencies["util"] = util$default(dependencies);
  dependencies["questionnaire"] = questionnaire$node(dependencies);
  dependencies["violation"] = violation$error(dependencies);
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["validate"] = validate$ajv(dependencies);
  dependencies["setup"] = setup$node(dependencies);
  return dependencies["setup"];
};