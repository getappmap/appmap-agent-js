import { assertDeepEqual } from "../../__fixture__.mjs";
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

const configuration = createConfiguration("file:///home");

assertDeepEqual(compileTrace(configuration, []), {
  head: configuration,
  body: [],
});
