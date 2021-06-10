import { setVisitor, visit, getEmptyResult } from './visit.mjs';

setVisitor(
  'MethodDefinition',
  (node, location) => [visit(node.key, location), visit(node.value, location)],
  (node, location, child1, child2) => ({
    type: 'MethodDefinition',
    kind: node.kind,
    computed: node.computed,
    static: node.static,
    key: child1,
    value: child2,
  }),
);

setVisitor(
  'ClassBody',
  (node, location) => [node.body.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'ClassBody',
    body: children,
  }),
);

{
  const split = (node, location) => [
    node.id === null ? getEmptyResult() : visit(node.id, location),
    node.superClass === null
      ? getEmptyResult()
      : visit(node.superClass, location),
    visit(node.body, location),
  ];
  const join = (node, location, child1, child2, child3) => ({
    type: node.type,
    id: child1,
    superClass: child2,
    body: child3,
  });
  setVisitor('ClassExpression', split, join);
  setVisitor('ClassDeclaration', split, join);
}
