import { assertDeepEqual } from "../../../../__fixture__.mjs";
import { createCounter } from "../../../../util/index.mjs?env=test";
import { extractEstreeEntityArray } from "./index.mjs?env=test";

assertDeepEqual(
  extractEstreeEntityArray("path", "123;", {
    separator: "@",
    counter: createCounter(0),
  }),
  [],
);
