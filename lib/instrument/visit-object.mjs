
import {combineResult} from "./result.mjs";
import {assignVisitorObject, visitMethod, visitExpression, visitNonComputedKey} from "./make-visit.mjs";

////////////////////
// ObjectProperty //
////////////////////

const makeSpreadElement = (node, child) => ({
  type: "SpreadElement",
  argument: child
});

const makeProperty = (node, child1, child2) => ({
  type: "Property",
  kind: node.kind,
  method: node.method,
  shorthand: false,
  key: child1,
  value: child2
});

assignVisitorObject("ObjectProperty", {
  __proto__: null,
  SpreadElement: (node, location) => combineResult(
    makeSpreadElement,
    node,
    visitExpression(node.argument, location)),
  Property: (node, location) => combineResult(
    makeProperty,
    node,
    (
      node.computed ?
      visitExpression(node.key, location) ;
      visitNonComputedKey(node.key, location)),
    (
      node.kind === "init" ?
      visitExpression(node.value, location) :
      visitMethod(node.value, location)))
});

////////////////
// Expression //
////////////////

const makeObjectExpression = (node, childeren) => ({
  type: "ObjectExpression",
  properties: childeren
});

assignVisitorObject("Expression", {
  ObjectExpression: (node, location) => encapsulateResult(
    combineResult(
      makeObjectExpression,
      node,
      node.properties.map((child) => visitProperty(child, location))))
});
