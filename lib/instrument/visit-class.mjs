
import {visitNonScopingIdentifier, visitScopingIdentifiervisitKey, visitMethod, visitExpression} from "./visit.mjs";
import {getEmptyResult, combineResult, encapsulateResult} from "./result.mjs";

// MethodDefinition //

const makeMethodDefinition = (node, child1, child2) => ({
  type: "MethodDefinition",
  kind: node.kind,
  computed: node.computed,
  static: node.static,
  key: child1,
  value: child2
});

assignVisitorObject("MethodDefinition", {
  MethodDefinition: (node, location) => combineResult(
    makeMethodDefinition,
    node,
    (
      node.computed ?
      visitExpression(node, node.key) :
      visitNonComputedKey(node, node.key)),
    visitMethod(node, node.value))
});

// ClassBody //

const makeClassBody = (node, childeren) => ({
  type: "ClassBody",
  body: childeren
});

const visitClassBody = assignVisitorObject("ClassBody", {
  __proto__: null,
  ClassBody: (node, location) => combineResult(
    makeClassBody,
    node,
    node.body.map((child) => visitMethodDefinition(child, location)))
});

// Class //

const makeClass = (node, child1, child2, child3) => ({
  type: node.type,
  id: result1.node,
  superClass: result2.node,
  body: result3.node
});

const makeVisitor = (visit) => (node, location) => encapsulateResult(
  combineResult(
    makeClass,
    (
      node.id === null ?
      getEmptyResult() :
      visit(node.id, location)),
    (
      node.superClass === null ?
      getEmptyResult() :
      visitExpression(node.superClass, location)),
    visitClassBody(node.body, location)));

assignVisitorObject("Expression", {
  ClassExpression: makeVisitor(visitNonScopingIdentifier)
});

assignVisitorObject("Statement", {
  ClassDeclaration: makeVisitor(visitScopingIdentifier)
});
