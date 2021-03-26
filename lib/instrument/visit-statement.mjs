import { setVisitor, visit, getEmptyResult, getEmptyArray } from './visit.mjs';

////////////
// Atomic //
////////////

// ReturnStatement cf visit-common-closure.mjs

setVisitor("ThrowStatement", (node, context) => [
  visit(node.argument, context)
], (node, context, child) => ({
  type: 'ThrowStatement',
  argument: child,
}));

setVisitor("ExpressionStatement", (node, context) => [
  visit(node.expression, context),
], (node, context, child) => ({
  type: "ExpressionStatement",
  expression: child
}));

setVisitor("DebuggerStatement", getEmptyArray, (node, context) => ({
  type: "DebuggerStatement"
}));

setVisitor("BreakStatement", (node, context) => [
  node.label === null ? getEmptyResult() : visit(node.label, context)
], (node, context, child) => ({
  type: 'BreakStatement',
  label: child,
}));

setVisitor("ContinueStatement", (node, context) => [
    node.label === null ? getEmptyResult() : visit(node.label, context)
], (node, context, child) => ({
  type: 'ContinueStatement',
  label: child,
}));

/////////////////
// Declaration //
/////////////////

// FunctionDeclaration cf visit-common-closure.mjs
// ClassDeclaration cf visit-common-class.mjs

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

setVisitor("VariableDeclaration", (node, context) => [
  node.declarations.map((child) =>
    visit(child, context),
  )
], (node, context, childeren) => ({
  type: 'VariableDeclaration',
  kind: node.kind,
  declarations: childeren,
}));

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

setVisitor("ImportDeclaration", (node, context) => [
  node.specifiers.map((child) => visit(child, context)),
  visit(node.source, context),
], (node, context, childeren, child) => ({
  type: 'ImportDeclaration',
  specifiers: childeren,
  source: child,
}));

setVisitor("ExportSpecifier", (node, context) => [
  visit(node.local, context),
  visit(node.exported, context)
], (node, context, child1, child2) => ({
  type: 'ExportSpecifier',
  local: child1,
  exported: child2,
}));

setVisitor("ExportNamedDeclaration", (node, context) => [
  node.declaration === null ? getEmptyResult() : visit(node.declaration, context),
  node.specifiers.map((child) => visit(child, context)),
  node.source === null ? getEmptyResult() : visit(node.source, context)
], (node, context, child1, childeren, child2) => ({
  type: 'ExportNamedDeclaration',
  declaration: child1,
  specifiers: childeren,
  source: child2,
}));

setVisitor("ExportDefaultDeclaration", (node, context) => [
  visit(node.declaration, context)
], (node, context, child) => ({
  type: 'ExportDefaultDeclaration',
  declaration: child,
}));

setVisitor("ExportAllDeclaration", (node, context) => [
  visit(node.source, context)
], (node, context, child) => ({
  type: 'ExportAllDeclaration',
  source: child,
}));

//////////////
// Compound //
//////////////

setVisitor("BlockStatement", (node, context) => [
  node.body.map((child) => visit(child, context))
], (node, context, childeren) => ({
  type: 'BlockStatement',
  body: childeren,
}));

setVisitor("LabeledStatement", (node, context) => [
  visit(node.label, context),
  visit(node.body, context)
], (node, context, child1, child2) => ({
  type: 'LabeledStatement',
  label: child1,
  body: child2,
}));

setVisitor("IfStatement", (node, context) => [
  visit(node.test, context),
  visit(node.consequent, context),
  visit.alternate === null ? getEmptyResult() : visit(node.alternate, context)
], (node, context, child1, child2, child3) => ({
  type: 'IfStatement',
  test: child1,
  consequent: child2,
  alternate: child3,
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

setVisitor("TryStatement", (node, context) => [
  visit(node.block, context),
  visit.handler === null ? getEmptyResult() : visit(node.handler, context),
  visit.finalizer === null ? getEmptyResult() : visit(node.finalizer, context)
], (node, context, child1, child2, child3) => ({
  type: 'TryStatement',
  block: child1,
  handler: child2,
  finalizer: child3,
}));

setVisitor("WhileStatement", (node, context) => [
  visit(node.test, context),
  visit(node.body, context),
], (node, context, child1, child2) => ({
  type: 'WhileStatement',
  test: child1,
  body: child2,
}));

setVisitor("DoWhileStatement", (node, context) => [
  visit(node.test, context),
  visit(node.body, context),
], (node, context, child1, child2) => ({
  type: 'DoWhileStatement',
  test: child1,
  body: child2,
}));

setVisitor("ForStatement", (node, context) => [
  node.init === null ? getEmptyResult() : visit(node.init, context),
  node.test === null ? getEmptyResult() : visit(node.test, context),
  node.update === null ? getEmptyResult() : visit(node.update, context),
  visit(node.body, context)
], (node, context, child1, child2, child3, child4) => ({
  type: 'ForStatement',
  init: child1,
  test: child2,
  update: child3,
  body: child4,
}));

setVisitor("ForOfStatement", (node, context) => [
  visit(node.left, context),
  visit(node.right, context),
  visit(node.body, context),
], (node, context, child1, child2, child3) => ({
  type: 'ForOfStatement',
  await: node.await,
  left: child1,
  right: child2,
  body: child3,
}));

setVisitor("ForInStatement", (node, context) => [
  visit(node.left, context),
  visit(node.right, context),
  visit(node.body, context),
], (node, context, child1, child2, child3) => ({
  type: 'ForInStatement',
  left: child1,
  right: child2,
  body: child3,
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

setVisitor("SwitchStatement", (node, context) => [
  visit(node.discriminant, context),
  node.cases.map((child) => visit(child, context)),
], (node, context, child, childeren) => ({
  type: 'SwitchStatement',
  discriminant: child,
  cases: childeren,
}));
