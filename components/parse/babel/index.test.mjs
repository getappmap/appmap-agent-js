import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  parseEstree,
  printComment,
  getLeadingCommentArray,
  extractCommentLabelArray,
} from "./index.mjs";

parseEstree({
  "protocol://host/dirname/filename.mjs?search#hash",
  "export const x = 123;",
});
parseEstree({
  "protocol://host/dirname/filename.mjs?search#hash",
  "export const x = 123; delete x;",
});
parseEstree({
  "protocol://host/dirname/filename.cjs?search#hash",
  "exports.x = 123;",
});
parseEstree({
  "protocol://host/dirname/filename.ts?search#hash",
  "const x: number = <JSX />;",
});
parseEstree({
  "protocol://host/dirname/filename.js?search#hash",
  "/* @flow */ const x: number = <JSX />;",
});
assertDeepEqual({
  parseEstree("protocol://host/dirname/filename.js?search#hash", "{"),
  {
    type: "Program",
    body: [],
    sourceType: "script",
    loc: {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 },
      filename: "protocol://host/dirname/filename.js?search#hash",
    },
  },
});

{
  const parsedClass = parseEstree({
    "protocol://host/dirname/filename.js?search#hash",
    "class Foo { prop; }",
  });

  // make sure property definitions have estree-compliant type
  assertEqual(parsedClass.body[0].body.body[0].type, "PropertyDefinition");
}

assertDeepEqual(
  getLeadingCommentArray(
    parseEstree({
      "protocol://host/dirname/filename.js",
      "// line\n/* block */\n123;",
    }).body[0],
  ).map(printComment),
  ["// line", "/* block */"],
);

assertDeepEqual(
  getLeadingCommentArray(
    parseEstree({
      "protocol://host/dirname/filename.js",
      `
      // foo
      // @label l1 l2
      // @label${" "}
      /*
        @label l3
        bar
      */
      /* @label l4 */
      123;
    `,
  }).body[0],
  ).flatMap(extractCommentLabelArray),
  ["l1", "l2", "l3", "l4"],
);
