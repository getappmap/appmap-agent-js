import { setVisitor, visit, getEmptyResult } from './visit.mjs';

// Identifier cf visit-common-other.mjs

setVisitor(
  'AssignmentPattern',
  (node, location) => [visit(node.left, location), visit(node.right, location)],
  (node, location, child1, child2) => ({
    type: 'AssignmentPattern',
    left: child1,
    right: child2,
  }),
  identity
);

// Property cf visit-common-other.mjs
setVisitor(
  'ObjectPattern',
  (node, location) => [node.properties.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'ObjectPattern',
    properties: children,
  }),
);

setVisitor(
  'ArrayPattern',
  (node, location) => [
    node.elements.map((child) =>
      child === null ? getEmptyResult() : visit(child, location),
    ),
  ],
  (node, location, children) => ({
    type: 'ArrayPattern',
    elements: children,
  }),
);

setVisitor(
  'RestElement',
  (node, location) => [visit(node.argument, location)],
  (ndoe, location, child) => ({
    type: 'RestElement',
    argument: child,
  }),
);
