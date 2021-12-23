import { assertDeepEqual } from "../../../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../../build.mjs";
import Estree from "./index.mjs";

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
