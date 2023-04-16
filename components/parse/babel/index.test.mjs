import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  parseEstree,
  printComment,
  getLeadingCommentArray,
  extractCommentLabelArray,
} from "./index.mjs";

////////////////
// SourceType //
////////////////

for (const source of ["module", "script", null]) {
  for (const extension of [".cjs", ".node", ".js", ".mjs"]) {
    parseEstree(
      {
        url: `protocol://host/dirname/filename${extension}?search#hash`,
        content: "export const x = 123;",
      },
      { source, plugins: [] },
    );
  }
}

/////////////////
// Recoverable //
/////////////////

parseEstree(
  {
    url: "protocol://host/dirname/filename.mjs?search#hash",
    content: "export const x = 123; delete x;",
  },
  { source: "module", plugins: [] },
);

///////////////////
// Unrecoverable //
///////////////////

assertDeepEqual(
  parseEstree(
    {
      url: "protocol://host/dirname/filename.js?search#hash",
      content: "{",
    },
    { source: "module", plugins: [] },
  ),
  {
    type: "Program",
    body: [],
    sourceType: "module",
    loc: {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 },
      filename: "protocol://host/dirname/filename.js?search#hash",
    },
  },
);

assertDeepEqual(
  parseEstree(
    {
      url: "protocol://host/dirname/filename.js?search#hash",
      content: "{",
    },
    { source: null, plugins: [] },
  ),
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

////////////////
// Typescript //
////////////////

parseEstree(
  {
    url: "protocol://host/dirname/filename.ts?search#hash",
    content: "export const x: number = 123;",
  },
  { source: "module", plugins: null },
);

parseEstree(
  {
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "export const x: number = 123;",
  },
  { source: "module", plugins: ["typescript"] },
);

////////////////////////
// Typescript + React //
////////////////////////

parseEstree(
  {
    url: "protocol://host/dirname/filename.tsx?search#hash",
    content: "const x: number = <jsx />;",
  },
  { source: "module", plugins: null },
);

parseEstree(
  {
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "const x: number = <jsx />;",
  },
  { source: "module", plugins: ["typescript", "jsx"] },
);

//////////
// Flow //
//////////

parseEstree(
  {
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "/* @flow */ const x: number = 123;",
  },
  { source: "module", plugins: null },
);

parseEstree(
  {
    url: "protocol://host/dirname/filename.js.flow?search#hash",
    content: "const x: number = 123;",
  },
  { source: "module", plugins: null },
);

parseEstree(
  {
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "const x: number = 123;",
  },
  { source: "module", plugins: ["flow"] },
);

//////////////////
// Flow + React //
//////////////////

parseEstree(
  {
    url: "protocol://host/dirname/filename.jsx?search#hash",
    content: "/* @flow */ const x: number = <jsx />;",
  },
  { source: "module", plugins: null },
);

parseEstree(
  {
    url: "protocol://host/dirname/filename.jsx.flow?search#hash",
    content: "const x: number = <jsx />;",
  },
  { source: "module", plugins: null },
);

parseEstree(
  {
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "const x: number = <jsx />;",
  },
  { source: "module", plugins: ["flow", "jsx"] },
);

/////////////////////////
// ECMAScript Proposal //
/////////////////////////

parseEstree(
  {
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "([|1, 2|]);",
  },
  { source: "module", plugins: ["recordAndtuple", { syntaxType: "bar" }] },
);

parseEstree(
  {
    url: "protocol://host/dirname/filename.js?search#hash",
    content: "([|1, 2|]);",
  },
  { source: "module", plugins: ["recordAndtuple", { syntaxType: "bar" }] },
);

////////////
// Estree //
////////////

{
  const parsedClass = parseEstree(
    {
      url: "protocol://host/dirname/filename.js?search#hash",
      content: "class Foo { prop; }",
    },
    { source: "module", plugins: [] },
  );
  // make sure property definitions have estree-compliant type
  assertEqual(parsedClass.body[0].body.body[0].type, "PropertyDefinition");
}

/////////////
// Comment //
/////////////

assertDeepEqual(
  getLeadingCommentArray(
    parseEstree(
      {
        url: "protocol://host/dirname/filename.js",
        content: "// line\n/* block */\n123;",
      },
      { source: "module", plugins: [] },
    ).body[0],
  ).map(printComment),
  ["// line", "/* block */"],
);

assertDeepEqual(
  getLeadingCommentArray(
    parseEstree(
      {
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
      },
      { source: "module", plugins: [] },
    ).body[0],
  ).flatMap(extractCommentLabelArray),
  ["l1", "l2", "l3", "l4"],
);
