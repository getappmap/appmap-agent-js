
import {visitKey, visitMethod, visitExpression} from "./visit.mjs";
import {getEmptyResult, combineResult, encapsulateResult} from "./result.mjs";

const constructMethodDefinition = (node, child1, child2) => ({
  type: "MethodDefinition",
  kind: node.kind,
  computed: node.computed,
  static: node.static,
  key: child1,
  value: child2
});

assignVisitorObject("MethodDefinition", {
  MethodDefinition: (node, location) => {
    let result1;
    if (node.computed) {
      result1 = visitExpression(node, node.key);
    } else {
      result1 = visitNonComputedKey(node, node.key);
    }
    const result2 = visitMethod(node, node.value);
    return combineResult(constructMethodDefinition, node, resul1, result2);
  }
});

const constructClassBody = (node, childeren) => ({
  type: "ClassBody",
  body: childeren
});

const visitClassBody = assignVisitorObject("ClassBody", {
  __proto__: null,
  ClassBody: (node, location) => {
    const results = node.body.map((child) => visitMethodDefinition(child, location));
    return combineResult(constructClassBody, node, results);
  }
});

const constructClass = (node, child1, child2, child3) => ({
  type: node.type,
  id: result1.node,
  superClass: result2.node,
  body: result3.node
});

const common = (node, location) => {
  // console.assert(node.type === "ClassExpression" || node.type === "ClassDeclaration");
  let result1 = getEmptyResult();
  if (node.id !== null) {
    result1 = visitName(node.id, location);
  }
  let result2 = getEmptyResult();
  if (node.superClass !== null) {
    result2 = visitExpression(node.superClass, location);
  }
  const result3 = visitClassBody(node.body, location);
  return encapsulateResult(combineResult(constructClass, result1, result2, result3), location);
};

assignVisitorObject("Expression", {
  ClassExpression: common
});

assignVisitorObject("Statement", {
  ClassDeclaration: common
});
