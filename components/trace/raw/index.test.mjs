import { assertDeepEqual, makeAbsolutePath } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Trace from "./index.mjs";

const { createConfiguration } = await buildTestComponentAsync(
  "configuration",
  "test",
);

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { compileTrace } = Trace(dependencies);

const configuration = createConfiguration(makeAbsolutePath("root"));
const termination = { status: 0, errors: [] };

assertDeepEqual(compileTrace(configuration, [], [], termination), {
  configuration,
  sources: [],
  events: [],
  termination,
});
