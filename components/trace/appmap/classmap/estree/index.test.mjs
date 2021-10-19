import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../../../build.mjs";
import Estree from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const { extractEstreeClassmap } = Estree(
  await buildTestDependenciesAsync(import.meta.url),
);

assertDeepEqual(extractEstreeClassmap("123;", { path: "path" }), []);
