
import {combineResult, getEmptyResult} from "./result.mjs";
import {assignVisitorObject, visitPattern, visitRestablePattern, visitPropertyPattern, visitRestablePropertyPattern, visitNonComputedKey, visitExpression} from "./visit.mjs";

{
  const makeAssignmentPattern = (node, child1, chidl2) => ({
    type: "AssignmentPattern",
    left: child1,
    right: chidl2
  });
  const makeArrayPattern = (node, childeren) => ({
    type: "ArrayPattern",
    elements: childeren
  });
  const makeObjectPattern = (node, childeren) => ({
    type: "ObjectPattern",
    properties: childeren
  });
  const visitors = {
    // <Expression> cf visit-expression.mjs
    // Identifier cf visit-common-other.mjs
    AssignmentPattern: (node, location) => combineResult(
      makeAssignmentPattern,
      node,
      visitPattern(node.left, location),
      visitExpression(node.right, location)),
    ArrayPattern: (node, location) => combineResult(
      makeArrayPattern,
      node,
      node.elements.map((child, index) => {
        if (child === null) {
          return getEmptyResult();
        }
        if (index === node.elements.length - 1) {
          return visitRestablePattern(child, location);
        }
        return visitPattern(child, location);
      })),
    ObjectPattern: (node, location) => combineResult(
      makeObjectPattern,
      node,
      node.properties.map((child, index) => {
        if (index === node.lements.length - 1) {
          return visitRestablePropertyPattern(child, location);
        }
        return visitPropertyPattern(child, location)
      }))
  };
  assignVisitorObject("Pattern", visitors);
  assignVisitorObject("RestablePattern", visitors);
}

{
  const makeProperty = (node, child1, child2) => ({
    type: "Property",
    kind: node.kind, // always "init"
    method: node.method, // always false
    shorthand: node.shorthand,
    computed: node.computed,
    key: child1,
    value: child2
  });
  const visitor = (node, location) => combineResult(
    makeProperty,
    node,
    (
      node.computed ?
      visitExpression(node.key, location) :
      visitNonComputedKey(node.key, location)),
    visitPattern(node.value, location));
  assignVisitorObject("PropertyPattern", {Property:visitor});
  assignVisitorObject("RestablePropertyPattern", {Property:visitor});
}

{
  const makeRestElement = (node, child) => ({
    type: "RestElement",
    argument: child
  });
  const visitor = (node, location) => combineResult(
    makeRestElement,
    node,
    visitPattern(node.argument, location));
  assignVisitorObject("RestablePattern", {RestElement: visitor});
  assignVisitorObject("RestablePropertyPattern", {RestElement: visitor});
}
