import { assertDeepEqual } from "../../../__fixture__.mjs";
import {
  parseEstree,
  printComment,
  getLeadingCommentArray,
  extractCommentLabelArray,
} from "./parse.mjs?env=test";

parseEstree(
  "protocol://host/dirname/filename.mjs?search#hash",
  "export const x = 123;",
);
parseEstree(
  "protocol://host/dirname/filename.mjs?search#hash",
  "export const x = 123; delete x;",
);
parseEstree(
  "protocol://host/dirname/filename.cjs?search#hash",
  "exports.x = 123;",
);
parseEstree(
  "protocol://host/dirname/filename.ts?search#hash",
  "const x: number = <JSX />;",
);
parseEstree(
  "protocol://host/dirname/filename.js?search#hash",
  "/* @flow */ const x: number = <JSX />;",
);
parseEstree("protocol://host/dirname/filename.js?search#hash", "{");

assertDeepEqual(
  getLeadingCommentArray(
    parseEstree(
      "protocol://host/dirname/filename.js",
      "// line\n/* block */\n123;",
    ).body[0],
  ).map(printComment),
  ["// line", "/* block */"],
);

assertDeepEqual(
  getLeadingCommentArray(
    parseEstree(
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
    ).body[0],
  ).flatMap(extractCommentLabelArray),
  ["l1", "l2", "l3", "l4"],
);
