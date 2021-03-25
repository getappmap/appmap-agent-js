import { assignVisitorObject, visit } from './visit.mjs';
import { getEmptyResult, combineResult, encapsulateResult } from './result.mjs';

{
  const makeMethodDefinition = (node, location, child1, child2) => ({
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
        location,
        visit(
          node.computed ? 'Expression' : 'NonComputedKey',
          node.key,
          location,
        ),
        visit('Method', node.value, location),
      ),
  });
}

{
  const makeClassBody = (node, location, childeren) => ({
    type: 'ClassBody',
    body: childeren,
  });
  assignVisitorObject('ClassBody', {
    __proto__: null,
    ClassBody: (node, location) =>
      combineResult(
        makeClassBody,
        node,
        location,
        node.body.map((child) => visit('MethodDefinition', child, location)),
      ),
  });
}

{
  const makeClass = (node, location, child1, child2, child3) => ({
    type: node.type,
    id: child1,
    superClass: child2,
    body: child3,
  });
  const makeVisitor = (kind) => (node, location) =>
    encapsulateResult(
      combineResult(
        makeClass,
        node,
        location,
        node.id === null ? getEmptyResult() : visit(kind, node.id, location),
        node.superClass === null
          ? getEmptyResult()
          : visit('Expression', node.superClass, location),
        visit('ClassBody', node.body, location),
      ),
      location,
    );
  assignVisitorObject('Expression', {
    ClassExpression: makeVisitor('NonScopingIdentifier'),
  });
  assignVisitorObject('Statement', {
    ClassDeclaration: makeVisitor('ScopingIdentifier'),
  });
}
