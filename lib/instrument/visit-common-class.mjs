import { setVisitor, visit, getEmptyResult } from './visit.mjs';

setVisitor("MethodDefinition", (node, context) => [
  visit(node.key, context),
  visit(node.value, context),
], (node, context, child1, child2) => ({
  type: 'MethodDefinition',
  kind: node.kind,
  computed: node.computed,
  static: node.static,
  key: child1,
  value: child2,
}));

setVisitor("ClassBody", (node, context) => [
  node.body.map((child) => visit(child, context))
], (node, context, childeren) => ({
  type: "ClassBody",
  body: childeren
}));

{
  const split = (node, context) => [
    node.id === null ? getEmptyResult() : visit(node.id, context),
    node.superClass === null
      ? getEmptyResult()
      : visit(node.superClass, context),
    visit(node.body, context)
  ];
  const join = (node, location, child1, child2, child3) => ({
    type: node.type,
    id: child1,
    superClass: child2,
    body: child3,
  });
  setVisitor("ClassExpression", split, join);
  setVisitor("ClassDeclaration", split, join);
}
