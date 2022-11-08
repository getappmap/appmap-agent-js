import { assertDeepEqual } from "../../../__fixture__.mjs";
import { createCounter } from "../../../util/index.mjs?env=test";
import { extractEstreeEntityArray } from "./estree.mjs?env=test";

assertDeepEqual(
  extractEstreeEntityArray("script.js", "123;", {
    separator: "@",
    counter: createCounter(0),
  }),
  [],
);
