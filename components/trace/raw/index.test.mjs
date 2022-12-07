import { assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
import { compileTrace } from "./index.mjs";

const configuration = createConfiguration("protocol://host/home");

assertDeepEqual(compileTrace(configuration, []), {
  head: configuration,
  body: [],
});
