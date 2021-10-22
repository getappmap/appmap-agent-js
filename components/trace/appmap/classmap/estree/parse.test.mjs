import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../../../build.mjs";
import Parse from "./parse.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const { parse, getLeadingCommentArray } = Parse(
  await buildTestDependenciesAsync(import.meta.url),
);

parse("script.mjs", "export const x = 123;");
parse("script.mjs", "export const x = 123; delete x;");
parse("script.cjs", "exports.x = 123;");
parse("script.ts", "const x: number = <JSX />;");
parse("script.js", "/* @flow */ const x: number = <JSX />;");

assertDeepEqual(
  getLeadingCommentArray(
    parse("script.js", "/* Block */ // Line\n 123;").body[0],
  ),
  ["/* Block */", "// Line"],
);
