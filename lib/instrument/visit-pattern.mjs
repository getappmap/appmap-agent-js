
import {combineResult} from "./result.mjs";
import {assignVisitorObject, getVisitorObject, visitNonComputedKey, visitExpression} from "./visit.mjs";

/////////////
// Pattern //
/////////////

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

assignVisitorObject("Pattern", {
  ...getVisitorObject("Expression"),
  Identifier: getVisitorObject("NoneScopingIdentifier").Identifier,
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
    node.properties.map((child) => {
      if (index === node.lements.length - 1) {
        return visitRestablePropertyPattern(child, location);
      }
      return visitPatternProperty(child, location)
    }))
});


/////////////////////
// PropertyPattern //
/////////////////////

{
  const makeProperty = (node, child1, child2) => ({
    type: "Property",
    kind: node.kind, // always "init"
    method: node.method, // always false
    shorthand: node.shorthand,
    computed: node.computed,
    key: pair1.node,
    value: pair2.node
  });
  assignVisitorObject("PropertyPattern", {
    Property: (node, location) => combineResult(
      makeProperty,
      node,
      (
        node.computed ?
        visitExpression(node.key, location);
        visitNonComputedKey(node.key, location)),
      visitPattern(node.value, location))
  });
}

////////////////////////////////////////////////
// RestablePattern && RestablePropertyPattern //
////////////////////////////////////////////////

{
  const makeRestElement = (node, child) => ({
    type: "RestElement",
    argument: child
  });
  const visitor = combineResult(
    makeRestElement,
    node,
    visitPattern(node.argument, location));
  assignVisitorObject("RestablePattern", {
    ...getVisitorObject("Pattern"),
    RestElement: visitor
  });
  assignVisitorObject("RestablePropertyPattern", {
    Property: getVisitorObject("PropertyPattern").Property,
    RestElement: visitor
  });
}
