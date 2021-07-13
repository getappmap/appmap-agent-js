import { makeCaption, captionize } from "./caption.mjs";
import { makeClassEntity } from "./entity.mjs";
import {
  setVisitor,
  setSimpleVisitor,
  visit,
  getEmptyVisitResult,
} from "./visit.mjs";

setSimpleVisitor(
  "MethodDefinition",
  (node, context) => [
    visit(node.key, context, node),
    visit(node.value, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "MethodDefinition",
    kind: node.kind,
    computed: node.computed,
    static: node.static,
    key: child1,
    value: child2,
  }),
);

setSimpleVisitor(
  "ClassBody",
  (node, context) => [node.body.map((child) => visit(child, context, node))],
  (node, context, children) => ({
    type: "ClassBody",
    body: children,
  }),
);

const isMethodDefinition = ({ caption: { origin } }) =>
  origin === "MethodDefinition";

const isNotMethodDefinition = ({ caption: { origin } }) =>
  origin !== "MethodDefinition";

const split = (node, context) => [
  node.id === null ? getEmptyVisitResult() : visit(node.id, context, node),
  node.superClass === null
    ? getEmptyVisitResult()
    : visit(node.superClass, context, node),
  visit(node.body, context, node),
];

const join = (node, context, child1, child2, child3) => ({
  type: node.type,
  id: child1,
  superClass: child2,
  body: child3,
});

const after = (node, context, entities) => [
  makeClassEntity(node, entities.filter(isMethodDefinition)),
  ...entities.filter(isNotMethodDefinition),
];

setVisitor(
  "ClassDeclaration",
  (node, context) =>
    makeCaption(
      "ClassDeclaration",
      node.id === null ? "default" : node.id.name,
    ),
  split,
  after,
  join,
);

setVisitor(
  "ClassExpression",
  (node, context) =>
    node.id === null
      ? captionize(node)
      : makeCaption("ClassExpression", node.id.name),
  split,
  after,
  join,
);
