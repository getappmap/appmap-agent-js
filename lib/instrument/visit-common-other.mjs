import { setVisitor, visit, getEmptyResult, getEmptyArray } from './visit.mjs';

////////////////
// Identifier //
////////////////

setVisitor("Identifier", getEmptyArray, (node, context) => {
  if (context.location.isScopingIdentifier()) {
    context.namespace.checkCollision(node.name);
  }
  return {
    type: "Identifier",
    name: node.name
  };
});

/////////////
// Program //
/////////////

setVisitor("Program", (node, context) => [
  node.body.map((child) => visit(child, context))
], (node, context, childeren) => ({
  type: 'Program',
  sourceType: node.sourceType,
  body: childeren,
}));

///////////////////////////////////////////
// Pattern-Related && Expression-Related //
///////////////////////////////////////////

setVisitor("Property", (node, context) => [
  visit(node.key, context),
  visit(node.value, context)
], (node, context, child1, child2) => ({
  type: 'Property',
  kind: node.kind,
  method: node.method,
  computed: node.computed,
  shorthand: false,
  key: child1,
  value: child2,
}));

////////////////////////
// Expression-Related //
////////////////////////

setVisitor("TemplateElement", getEmptyArray, (node, context) => ({
  type: 'TemplateElement',
  tail: node.tail,
  value: {
    cooked: node.value.cooked,
    raw: node.value.raw,
  },
}));

setVisitor("SpreadElement", (node, context) => [
  visit(node.argument, context)
], (node, context, child) => ({
  type: "SpreadElement",
  argument: child
}));

setVisitor("Super", getEmptyArray, (node, context) => ({
  type: 'Super',
}));

///////////////
// Specifier //
///////////////

setVisitor("ImportSpecifier", (node, context) => [
  visit(node.local, context),
  visit(node.imported, context),
], (node, context, child1, child2) => ({
  type: 'ImportSpecifier',
  local: child1,
  imported: child2,
}));

setVisitor("ImportDefaultSpecifier", (node, context) => [
  visit(node.local, context)
], (node, context, child) => ({
  type: 'ImportDefaultSpecifier',
  local: child,
}));

setVisitor("ImportNamespaceSpecifier", (node, context) => [
  visit(node.local, context)
], (node, context, child) => ({
  type: "ImportNamespaceSpecifier",
  local: child
}));

setVisitor("ExportSpecifier", (node, context) => [
  visit(node.local, context),
  visit(node.exported, context)
], (node, context, child1, child2) => ({
  type: 'ExportSpecifier',
  local: child1,
  exported: child2,
}));

///////////////////////
// Statement-Related //
///////////////////////

setVisitor("VariableDeclarator", (node, context) => [
  visit(node.id, context),
  node.init === null
    ? getEmptyResult()
    : visit(node.init, context)
], (node, context, child1, child2) => ({
  type: 'VariableDeclarator',
  id: child1,
  init: child2,
}));

setVisitor("SwitchCase", (node, context) => [
  node.test === null
    ? getEmptyResult()
    : visit(node.test, context),
  node.consequent((child) => visit(child, context)),
], (node, context, child, childeren) => ({
  type: 'SwitchCase',
  test: child,
  consequent: childeren,
}));

setVisitor("CatchClause", (node, context) => [
  node.param === null
    ? getEmptyResult()
    : visit(node.param, context),
  visit(node.body, context),
], (node, context, child1, child2) => ({
  type: 'CatchClause',
  param: child1,
  body: child2,
}));
