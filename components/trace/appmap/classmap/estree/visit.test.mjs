import { strict as Assert } from "assert";
import { parse as parseAcorn } from "acorn";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../../build.mjs";
import Visit from "./visit.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const { createCounter } = await buildTestComponentAsync("util");

const { visit } = Visit(await buildTestDependenciesAsync(import.meta.url));

const test = (content, separator, comments) =>
  visit(
    parseAcorn(content, {
      ecmaVersion: 2021,
      sourceType: "module",
      locations: true,
    }),
    {
      naming: {
        separator,
        counter: createCounter(0),
      },
      getLeadingCommentArray: () => comments,
    },
  );

assertDeepEqual(test("({k:{}});", "@", ["comment"]), [
  {
    type: "class",
    name: "object@1",
    children: [
      {
        type: "class",
        name: "k",
        children: [],
      },
    ],
  },
]);

assertDeepEqual(test("class c { static m (x) { } }", "@", ["comment"]), [
  {
    type: "class",
    name: "c",
    children: [
      {
        type: "function",
        name: "m",
        line: 1,
        column: 19,
        static: true,
        comments: ["comment"],
        range: [19, 26],
        parameters: [[20, 21]],
        labels: [],
        children: [],
      },
    ],
  },
]);
