import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../../../build.mjs";
import Parse from "./parse.mjs";

Error.stackTraceLimit = Infinity;

const {
  // deepEqual: assertDeepEqual,
  equal: assertEqual,
} = Assert;

const { parse, getLeadingComment } = Parse(
  await buildTestDependenciesAsync(import.meta.url),
);

parse("script.mjs", "export const x = 123;");
parse("script.mjs", "export const x = 123; delete x;");
parse("script.cjs", "exports.x = 123;");
parse("script.ts", "const x: number = <JSX />;");
parse("script.js", "/* @flow */ const x: number = <JSX />;");

assertEqual(
  getLeadingComment(parse("script.js", "/* Block */ // Line\n 123;").body[0]),
  "/* Block */\n// Line",
);
