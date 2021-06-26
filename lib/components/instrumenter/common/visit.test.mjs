import { strict as Assert } from "assert";
import * as Acorn from "acorn";
import * as Escodegen from "escodegen";
import { Counter } from "../../../util/index.mjs";
import { getNodeCaption, getNodeIndex } from "./node.mjs";
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
  (node, context) => node.name,
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
      counter: new Counter(),
      exclude: (caption) => caption === "foo",
    },
    null,
  );
  Assert.equal(Escodegen.generate(node), "foo(barbar, quxqux)");
  Assert.deepEqual(entities, [
    {
      caption: "bar",
      children: [],
      index: 1,
    },
    {
      caption: "qux",
      children: [],
      index: 2,
    },
  ]);
}
