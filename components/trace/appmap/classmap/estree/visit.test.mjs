import { assertDeepEqual } from "../../../../__fixture__.mjs";
import * as Acorn from "acorn";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../../build.mjs";
import Visit from "./visit.mjs";

const { parse: parseAcorn } = Acorn;

const { createCounter } = await buildTestComponentAsync("util");

const { visit } = Visit(await buildTestDependenciesAsync(import.meta.url));

// console.log(JSON.stringify(visit(
//   (await import("@babel/parser")).default.parse(await (await import("fs/promises")).readFile("./yo.ts", "utf8"), {sourceType:"module", plugins:["typescript", "estree"]}),
//   {
//     naming: {
//       separator: "-",
//       counter: createCounter(0),
//     },
//     getLeadingCommentArray: () => [],
//   },
// ), null, 2));

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

assertDeepEqual(
  test("class c { static m (x) { } }", "@", [
    " @label-1 foo @label-2 ",
    "@label-3",
    "bar",
  ]),
  [
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
          comments: [" @label-1 foo @label-2 ", "@label-3", "bar"],
          range: [19, 26],
          parameters: [[20, 21]],
          labels: ["@label-1", "@label-2", "@label-3"],
          children: [],
        },
      ],
    },
  ],
);
