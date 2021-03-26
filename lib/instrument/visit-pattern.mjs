import { setVisitor, visit, getEmptyResult } from './visit.mjs';

// Identifier cf visit-common-other.mjs

setVisitor("AssignmentPattern", (node, context) => [
  visit(node.left, context),
  visit(node.right, context)
], (node, context, child1, chidl2) => ({
  type: 'AssignmentPattern',
  left: child1,
  right: chidl2,
}));

// Property cf visit-common-other.mjs
setVisitor(
  "ObjectPattern",
  (node, context) => [
    node.properties.map((child) => visit(child, context))
  ],
  (node, context, childeren) => ({
    type: 'ObjectPattern',
    properties: childeren,
  })
);

setVisitor(
  "ArrayPattern",
  (node, context) => [
    node.properties.map((child) => 
      child === null ?
        getEmptyResult() :
        visit(child, context))
  ],
  (node, context, childeren) => ({
    type: 'ArrayPattern',
    elements: childeren,
  })
);

setVisitor(
  "RestElement",
  (node, context) => [visit(node.argument, context)],
  (ndoe, context, child) => ({
    type: "RestElement",
    argument: child
  }));
