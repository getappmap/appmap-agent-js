import { assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import { compileTrace } from "./index.mjs?env=test";

const configuration = createConfiguration("file:///home");

assertDeepEqual(compileTrace(configuration, []), {
  head: configuration,
  body: [],
});
