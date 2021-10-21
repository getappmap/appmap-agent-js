import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../../build.mjs";
import Estree from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const { extractEstreeEntityArray } = Estree(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createCounter } = await buildTestComponentAsync("util");

assertDeepEqual(
  extractEstreeEntityArray("path", "123;", {
    separator: "@",
    counter: createCounter(0),
  }),
  [],
);
