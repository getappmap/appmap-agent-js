import { assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import { compileTrace } from "./index.mjs?env=test";

const configuration = createConfiguration("protocol://host/home");

assertDeepEqual(compileTrace(configuration, []), {
  head: configuration,
  body: [],
});
