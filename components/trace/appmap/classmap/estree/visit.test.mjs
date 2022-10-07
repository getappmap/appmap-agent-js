import { assertDeepEqual } from "../../../../__fixture__.mjs";
import * as Acorn from "acorn";
import { createCounter } from "../../../../util/index.mjs?env=test";
import { visit } from "./visit.mjs?env=test";

const { parse: parseAcorn } = Acorn;

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

assertDeepEqual(test("function f () {}", "@", []), [
  {
    type: "function",
    name: "f",
    line: 1,
    column: 0,
    static: false,
    comments: [],
    range: [0, 16],
    parameters: [],
    labels: [],
    children: [],
  },
]);

{
  const comments = [
    "  @label  label-1  label-2  \n  foo  ",
    "  bar  ",
    "  @label  label-3  ",
    "  @label  \n  qux  ",
  ];
  assertDeepEqual(test("class c { static m (x) { } }", "@", comments), [
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
          comments,
          range: [19, 26],
          parameters: [[20, 21]],
          labels: ["label-1", "label-2", "label-3"],
          children: [],
        },
      ],
    },
  ]);
}
