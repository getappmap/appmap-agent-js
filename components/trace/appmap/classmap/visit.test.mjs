import { assertDeepEqual } from "../../../__fixture__.mjs";
import { createCounter } from "../../../util/index.mjs?env=test";
import { parse } from "./parse.mjs?env=test";
import { visit } from "./visit.mjs?env=test";

const test = (content, separator) =>
  visit(parse("script.mjs", content), {
    separator,
    counter: createCounter(0),
  });

assertDeepEqual(test("({k:{}});", "@"), [
  {
    type: "class",
    excluded: false,
    name: "object@1",
    children: [
      {
        type: "class",
        excluded: false,
        name: "k",
        children: [],
      },
    ],
  },
]);

assertDeepEqual(
  test(
    `
      /*
        @label label-1 label-2
        foo
      */
      /* bar */
      // @label label-3
      // qux
      // @label${" "}
      function f () {}
    `,
    "@",
  ),
  [
    {
      type: "function",
      excluded: false,
      name: "f",
      children: [],
      parameters: [],
      static: false,
      range: [138, 154],
      line: 10,
      column: 6,
      comments: [
        "/*\n        @label label-1 label-2\n        foo\n      */",
        "/* bar */",
        "// @label label-3",
        "// qux",
        "// @label ",
      ],
      labels: ["label-1", "label-2", "label-3"],
    },
  ],
);

assertDeepEqual(test("class c { static m (x) { } }", "@"), [
  {
    type: "class",
    excluded: false,
    name: "c",
    children: [
      {
        type: "function",
        excluded: false,
        name: "m",
        line: 1,
        column: 19,
        static: true,
        comments: [],
        range: [19, 26],
        parameters: [[20, 21]],
        labels: [],
        children: [],
      },
    ],
  },
]);
