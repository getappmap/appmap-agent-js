import { assertDeepEqual } from "../../../__fixture__.mjs";
import {
  parse,
  printComment,
  getLeadingCommentArray,
  extractCommentLabelArray,
} from "./parse.mjs?env=test";

parse("dirname/filename.mjs?search#hash", "export const x = 123;");
parse("dirname/filename.mjs?search#hash", "export const x = 123; delete x;");
parse("dirname/filename.cjs?search#hash", "exports.x = 123;");
parse("dirname/filename.ts?search#hash", "const x: number = <JSX />;");
parse(
  "dirname/filename.js?search#hash",
  "/* @flow */ const x: number = <JSX />;",
);
parse("dirname/filename.js?search#hash", "{");

assertDeepEqual(
  getLeadingCommentArray(
    parse("script.js", "// line\n/* block */\n123;").body[0],
  ).map(printComment),
  ["// line", "/* block */"],
);

assertDeepEqual(
  getLeadingCommentArray(
    parse(
      "script.js",
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
    ).body[0],
  ).flatMap(extractCommentLabelArray),
  ["l1", "l2", "l3", "l4"],
);
