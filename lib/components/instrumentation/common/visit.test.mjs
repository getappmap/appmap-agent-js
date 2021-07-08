import { strict as Assert } from "assert";
import * as Acorn from "acorn";
import * as Escodegen from "escodegen";
import { makeIncrement } from "../../../util/index.mjs";
import { getNodeCaption, getNodeIndex } from "./node.mjs";
import { createCaption } from "./caption.mjs";
import {
  visit,
  setVisitor,
  setSimpleVisitor,
  getEmptyVisitResult,
} from "./visit.mjs";

Error.stackTraceLimit = Infinity;

Assert.deepEqual(getEmptyVisitResult(), {
  node: null,
  entities: [],
});

setVisitor(
  "Identifier",
  (node, context) => createCaption(node.type, node.name),
  (node, context) => [],
  (node, context, entities) => {
    Assert.deepEqual(entities, []);
    return [
      {
        caption: getNodeCaption(node),
        index: getNodeIndex(node),
        children: entities,
      },
    ];
  },
  (node, context, ...fields) => {
    Assert.deepEqual(fields, []);
    return {
      type: "Identifier",
      name: `${node.name}${node.name}`,
    };
  },
);

setSimpleVisitor(
  "CallExpression",
  (node, context) => [
    visit(node.callee, context, node),
    node.arguments.map((child) => visit(child, context, node)),
  ],
  (node, context, child, children) => ({
    type: "CallExpression",
    callee: child,
    arguments: children,
  }),
);

{
  const { node, entities } = visit(
    Acorn.parse(`foo(bar, qux);`, { ecmaVersion: 2020 }).body[0].expression,
    {
      increment: makeIncrement(),
      exclude: new Set(["foo"]),
    },
    null,
  );
  Assert.equal(Escodegen.generate(node), "foo(barbar, quxqux)");
  Assert.deepEqual(entities, [
    {
      caption: { origin: "Identifier", name: "bar" },
      children: [],
      index: 1,
    },
    {
      caption: { origin: "Identifier", name: "qux" },
      children: [],
      index: 2,
    },
  ]);
}
