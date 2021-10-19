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

const test = (content, options) =>
  visit(
    parseAcorn(content, {
      ecmaVersion: 2021,
      sourceType: "module",
      locations: true,
    }),
    {
      naming: {
        separator: "@",
        counter: createCounter(0),
      },
      key: "key",
      path: "path",
      inline: true,
      content,
      getLeadingComment: () => "comment",
      placeholder: "placeholder",
      closures: new Map(),
      ...options,
    },
  );

assertDeepEqual(test("({k:{}});"), [
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

assertDeepEqual(test("class c { static m () { } }"), [
  {
    type: "class",
    name: "c",
    children: [
      {
        type: "class",
        name: "m",
        children: [
          {
            type: "function",
            name: "placeholder",
            comment: "comment",
            location: "path:1",
            labels: [],
            source: "() { }",
            static: true,
          },
        ],
      },
    ],
  },
]);
