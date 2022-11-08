import { assertDeepEqual } from "../../../__fixture__.mjs";
import { parse, getLeadingCommentArray } from "./parse.mjs?env=test";

parse("script.mjs", "export const x = 123;");
parse("script.mjs", "export const x = 123; delete x;");
parse("script.cjs", "exports.x = 123;");
parse("script.ts", "const x: number = <JSX />;");
parse("script.js", "/* @flow */ const x: number = <JSX />;");
parse("script.js", "{");

assertDeepEqual(
  getLeadingCommentArray(
    parse("script.js", "/* Block */ // Line\n 123;").body[0],
  ),
  ["/* Block */", "// Line"],
);
