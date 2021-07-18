import { strict as Assert } from "assert";

import { testVisitor } from "./__fixture__.mjs";

Error.stackTraceLimit = Infinity;

// {
//   const node = parse(";");
//   Assert.equal(generate(node), ";");
//   Assert.equal(fetch(node, ["body", 0]).type, "EmptyStatement");
// }

Assert.throws(() => testVisitor(";", [], {}));

Assert.equal(testVisitor(";", [], { Program: null }), null);

Assert.equal(
  testVisitor(
    ";",
    ["body", "0"],
    {
      EmptyStatement: {
        extract: (
          {
            head: { type: type1 },
            tail: {
              head: { type: type2 },
            },
          },
          context,
        ) => {
          Assert.equal(type1, "EmptyStatement");
          Assert.equal(type2, "Program");
          Assert.equal(context, "context");
          return "info";
        },
        dismantle: ({ type }) => {
          Assert.equal(type, "EmptyStatement");
          return "field";
        },
        assemble: ({ type }, field, context, outline) => {
          Assert.equal(type, "EmptyStatement");
          Assert.equal(field, "field");
          Assert.equal(context, "context");
          Assert.equal(outline, "outline");
          return { type: "DebuggerStatement" };
        },
        sieve: "sieve",
      },
    },
    {
      info: "info",
      output: "debugger;",
      context: "context",
      outline: "outline",
    },
  ),
  "sieve",
);
