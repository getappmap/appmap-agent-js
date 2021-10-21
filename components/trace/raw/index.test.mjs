import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Trace from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const { createConfiguration } = await buildTestComponentAsync(
  "configuration",
  "test",
);

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { compileTrace } = Trace(dependencies);

const configuration = createConfiguration("/root");
const termination = { status: 0, errors: [] };

assertDeepEqual(compileTrace(configuration, [], [], termination), {
  configuration,
  sources: [],
  events: [],
  termination,
});
