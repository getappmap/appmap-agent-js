import {
  assignVisitorObject,
  visitClassBody,
  visitMethodDefinition,
  visitNonScopingIdentifier,
  visitScopingIdentifier,
  visitNonComputedKey,
  visitMethod,
  visitExpression,
} from './visit.mjs';
import { getEmptyResult, combineResult, encapsulateResult } from './result.mjs';

{
  const makeMethodDefinition = (node, child1, child2) => ({
    type: 'MethodDefinition',
    kind: node.kind,
    computed: node.computed,
    static: node.static,
    key: child1,
    value: child2,
  });
  assignVisitorObject('MethodDefinition', {
    MethodDefinition: (node, location) =>
      combineResult(
        makeMethodDefinition,
        node,
        node.computed
          ? visitExpression(node, node.key)
          : visitNonComputedKey(node, node.key),
        visitMethod(node, node.value),
      ),
  });
}

{
  const makeClassBody = (node, childeren) => ({
    type: 'ClassBody',
    body: childeren,
  });
  assignVisitorObject('ClassBody', {
    __proto__: null,
    ClassBody: (node, location) =>
      combineResult(
        makeClassBody,
        node,
        node.body.map((child) => visitMethodDefinition(child, location)),
      ),
  });
}

{
  const makeClass = (node, child1, child2, child3) => ({
    type: node.type,
    id: child1,
    superClass: child2,
    body: child3,
  });
  const makeVisitor = (visit) => (node, location) =>
    encapsulateResult(
      combineResult(
        makeClass,
        node.id === null ? getEmptyResult() : visit(node.id, location),
        node.superClass === null
          ? getEmptyResult()
          : visitExpression(node.superClass, location),
        visitClassBody(node.body, location),
      ),
    );
  assignVisitorObject('Expression', {
    ClassExpression: makeVisitor(visitNonScopingIdentifier),
  });
  assignVisitorObject('Statement', {
    ClassDeclaration: makeVisitor(visitScopingIdentifier),
  });
}
