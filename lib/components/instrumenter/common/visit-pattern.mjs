import { setSimpleVisitor, visit, getEmptyVisitResult } from "./visit.mjs";

// Identifier cf visit-common-other.mjs

setSimpleVisitor(
  "AssignmentPattern",
  (node, context) => [visit(node.left, context), visit(node.right, context)],
  (node, context, child1, child2) => ({
    type: "AssignmentPattern",
    left: child1,
    right: child2,
  }),
);

// Property cf visit-common-other.mjs
setSimpleVisitor(
  "ObjectPattern",
  (node, context) => [node.properties.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: "ObjectPattern",
    properties: children,
  }),
);

setSimpleVisitor(
  "ArrayPattern",
  (node, context) => [
    node.elements.map((child) =>
      child === null ? getEmptyVisitResult() : visit(child, context),
    ),
  ],
  (node, context, children) => ({
    type: "ArrayPattern",
    elements: children,
  }),
);

setSimpleVisitor(
  "RestElement",
  (node, context) => [visit(node.argument, context)],
  (ndoe, context, child) => ({
    type: "RestElement",
    argument: child,
  }),
);
