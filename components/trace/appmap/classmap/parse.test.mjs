import { assertDeepEqual } from "../../../__fixture__.mjs";
import { parse, getLeadingCommentArray } from "./parse.mjs?env=test";

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
    parse("script.js", "/* Block */ // Line\n 123;").body[0],
  ),
  ["/* Block */", "// Line"],
);
