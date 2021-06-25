import { strict as Assert } from "assert";
import * as Acorn from "acorn";
import * as Escodegen from "escodegen";
import { Counter } from "../../../util/index.mjs";
import {
  visit,
  setVisitor,
  setVisitorWrapper,
  getEmptyVisitResult,
} from "./visit.mjs";

Error.stackTraceLimit = Infinity;

// getEmptyVisitResult //

Assert.deepEqual(getEmptyVisitResult(), {
  node: null,
  entities: [],
});

// Normal //

setVisitor(
  "Identifier",
  (node, context) => [],
  (node, context, ...parts) => {
    Assert.deepEqual(parts, []);
    return {
      type: "Identifier",
      name: `${node.name}${node.name}`,
    };
  },
);

setVisitorWrapper(
  "Identifier",
  (node, context) => node.name,
  (caption, entities) => {
    Assert.deepEqual(entities, []);
    return [caption];
  },
);

setVisitor(
  "CallExpression",
  (node, context) => [
    visit(node.callee, context, node),
    node.arguments.map((child) => visit(child, context, node)),
  ],
  (node, context, callee, _arguments) => ({
    type: "CallExpression",
    callee,
    arguments: _arguments,
  }),
);

{
  const { node, entities } = visit(
    Acorn.parse(`foo(bar, qux);`, { ecmaVersion: 2020 }).body[0].expression,
    {
      counter: new Counter(),
      exclude: (caption) => caption === "foo",
    },
    null,
  );
  Assert.equal(Escodegen.generate(node), "foo(barbar, quxqux)");
  Assert.deepEqual(entities, ["bar", "qux"]);
}

// // Exclusion //
//
// {
//   setVisitor(
//     "ObjectExpression",
//     (node, context) => {
//       Assert.fail();
//     },
//     (fields, context) => {
//       Assert.fail();
//     },
//     (entities, context) => {
//       Assert.fail();
//     },
//   );
//   let node = Acorn.parse(`(x = {});`, { ecmaVersion: 2020 });
//   Assert.equal(
//     visit(node.body[0].expression.right, {
//       counter: new Counter(),
//       list: { head: node.body[0].expression, tail: null },
//       exclude: (name) => name === "x",
//     }).node.type,
//     "ObjectExpression",
//   );
// }
