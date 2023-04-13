import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  parseEstree,
  printComment,
  getLeadingCommentArray,
  extractCommentLabelArray,
} from "./index.mjs";

parseEstree({
  url: "protocol://host/dirname/filename.mjs?search#hash",
  content: "export const x = 123;",
});
parseEstree({
  url: "protocol://host/dirname/filename.mjs?search#hash",
  content: "export const x = 123; delete x;",
});
parseEstree({
  url: "protocol://host/dirname/filename.cjs?search#hash",
  content: "exports.x = 123;",
});
parseEstree({
  url: "protocol://host/dirname/filename.ts?search#hash",
  content: "const x: number = <JSX />;",
});
parseEstree({
  url: "protocol://host/dirname/filename.js?search#hash",
  content: "/* @flow */ const x: number = <JSX />;",
});
assertDeepEqual(
  parseEstree({
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "{",
  }),
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
);

{
  const parsedClass = parseEstree({
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "class Foo { prop; }",
  });
  // make sure property definitions have estree-compliant type
  assertEqual(parsedClass.body[0].body.body[0].type, "PropertyDefinition");
}

assertDeepEqual(
  getLeadingCommentArray(
    parseEstree({
      url: "protocol://host/dirname/filename.js",
      content: "// line\n/* block */\n123;",
    }).body[0],
  ).map(printComment),
  ["// line", "/* block */"],
);

assertDeepEqual(
  getLeadingCommentArray(
    parseEstree({
      url: "protocol://host/dirname/filename.js",
      content: `
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
