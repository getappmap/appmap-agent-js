import { setVisitor, visit, getEmptyResult, getEmptyArray } from './visit.mjs';

////////////
// Atomic //
////////////

// ReturnStatement cf visit-common-closure.mjs

setVisitor('EmptyStatement', getEmptyArray, (node, location) => ({
  type: 'EmptyStatement',
}));

setVisitor(
  'ThrowStatement',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'ThrowStatement',
    argument: child,
  }),
);

setVisitor(
  'ExpressionStatement',
  (node, location) => [visit(node.expression, location)],
  (node, location, child) => ({
    type: 'ExpressionStatement',
    expression: child,
  }),
);

setVisitor('DebuggerStatement', getEmptyArray, (node, location) => ({
  type: 'DebuggerStatement',
}));

setVisitor(
  'BreakStatement',
  (node, location) => [
    node.label === null ? getEmptyResult() : visit(node.label, location),
  ],
  (node, location, child) => ({
    type: 'BreakStatement',
    label: child,
  }),
);

setVisitor(
  'ContinueStatement',
  (node, location) => [
    node.label === null ? getEmptyResult() : visit(node.label, location),
  ],
  (node, location, child) => ({
    type: 'ContinueStatement',
    label: child,
  }),
);

/////////////////
// Declaration //
/////////////////

// FunctionDeclaration cf visit-common-closure.mjs
// ClassDeclaration cf visit-common-class.mjs

setVisitor(
  'VariableDeclarator',
  (node, location) => [
    visit(node.id, location),
    node.init === null ? getEmptyResult() : visit(node.init, location),
  ],
  (node, location, child1, child2) => ({
    type: 'VariableDeclarator',
    id: child1,
    init: child2,
  }),
);

setVisitor(
  'VariableDeclaration',
  (node, location) => [
    node.declarations.map((child) => visit(child, location)),
  ],
  (node, location, children) => ({
    type: 'VariableDeclaration',
    kind: node.kind,
    declarations: children,
  }),
);

setVisitor(
  'ImportSpecifier',
  (node, location) => [
    visit(node.local, location),
    visit(node.imported, location),
  ],
  (node, location, child1, child2) => ({
    type: 'ImportSpecifier',
    local: child1,
    imported: child2,
  }),
);

setVisitor(
  'ImportDefaultSpecifier',
  (node, location) => [visit(node.local, location)],
  (node, location, child) => ({
    type: 'ImportDefaultSpecifier',
    local: child,
  }),
);

setVisitor(
  'ImportNamespaceSpecifier',
  (node, location) => [visit(node.local, location)],
  (node, location, child) => ({
    type: 'ImportNamespaceSpecifier',
    local: child,
  }),
);

setVisitor(
  'ImportDeclaration',
  (node, location) => [
    node.specifiers.map((child) => visit(child, location)),
    visit(node.source, location),
  ],
  (node, location, children, child) => ({
    type: 'ImportDeclaration',
    specifiers: children,
    source: child,
  }),
);

setVisitor(
  'ExportSpecifier',
  (node, location) => [
    visit(node.local, location),
    visit(node.exported, location),
  ],
  (node, location, child1, child2) => ({
    type: 'ExportSpecifier',
    local: child1,
    exported: child2,
  }),
);

setVisitor(
  'ExportNamedDeclaration',
  (node, location) => [
    node.declaration === null
      ? getEmptyResult()
      : visit(node.declaration, location),
    node.specifiers.map((child) => visit(child, location)),
    node.source === null ? getEmptyResult() : visit(node.source, location),
  ],
  (node, location, child1, children, child2) => ({
    type: 'ExportNamedDeclaration',
    declaration: child1,
    specifiers: children,
    source: child2,
  }),
);

setVisitor(
  'ExportDefaultDeclaration',
  (node, location) => [visit(node.declaration, location)],
  (node, location, child) => ({
    type: 'ExportDefaultDeclaration',
    declaration: child,
  }),
);

setVisitor(
  'ExportAllDeclaration',
  (node, location) => [visit(node.source, location)],
  (node, location, child) => ({
    type: 'ExportAllDeclaration',
    source: child,
  }),
);

//////////////
// Compound //
//////////////

setVisitor(
  'BlockStatement',
  (node, location) => [node.body.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'BlockStatement',
    body: children,
  }),
);

setVisitor(
  'WithStatement',
  (node, location) => [
    visit(node.object, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2) => ({
    type: 'WithStatement',
    object: child1,
    body: child2,
  }),
);

setVisitor(
  'LabeledStatement',
  (node, location) => [visit(node.label, location), visit(node.body, location)],
  (node, location, child1, child2) => ({
    type: 'LabeledStatement',
    label: child1,
    body: child2,
  }),
);

setVisitor(
  'IfStatement',
  (node, location) => [
    visit(node.test, location),
    visit(node.consequent, location),
    node.alternate === null
      ? getEmptyResult()
      : visit(node.alternate, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'IfStatement',
    test: child1,
    consequent: child2,
    alternate: child3,
  }),
);

setVisitor(
  'CatchClause',
  (node, location) => [
    node.param === null ? getEmptyResult() : visit(node.param, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2) => ({
    type: 'CatchClause',
    param: child1,
    body: child2,
  }),
);

setVisitor(
  'TryStatement',
  (node, location) => [
    visit(node.block, location),
    node.handler === null ? getEmptyResult() : visit(node.handler, location),
    node.finalizer === null
      ? getEmptyResult()
      : visit(node.finalizer, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'TryStatement',
    block: child1,
    handler: child2,
    finalizer: child3,
  }),
);

setVisitor(
  'WhileStatement',
  (node, location) => [visit(node.test, location), visit(node.body, location)],
  (node, location, child1, child2) => ({
    type: 'WhileStatement',
    test: child1,
    body: child2,
  }),
);

setVisitor(
  'DoWhileStatement',
  (node, location) => [visit(node.test, location), visit(node.body, location)],
  (node, location, child1, child2) => ({
    type: 'DoWhileStatement',
    test: child1,
    body: child2,
  }),
);

setVisitor(
  'ForStatement',
  (node, location) => [
    node.init === null ? getEmptyResult() : visit(node.init, location),
    node.test === null ? getEmptyResult() : visit(node.test, location),
    node.update === null ? getEmptyResult() : visit(node.update, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2, child3, child4) => ({
    type: 'ForStatement',
    init: child1,
    test: child2,
    update: child3,
    body: child4,
  }),
);

setVisitor(
  'ForOfStatement',
  (node, location) => [
    visit(node.left, location),
    visit(node.right, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'ForOfStatement',
    await: node.await,
    left: child1,
    right: child2,
    body: child3,
  }),
);

setVisitor(
  'ForInStatement',
  (node, location) => [
    visit(node.left, location),
    visit(node.right, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'ForInStatement',
    left: child1,
    right: child2,
    body: child3,
  }),
);

setVisitor(
  'SwitchCase',
  (node, location) => [
    node.test === null ? getEmptyResult() : visit(node.test, location),
    node.consequent.map((child) => visit(child, location)),
  ],
  (node, location, child, children) => ({
    type: 'SwitchCase',
    test: child,
    consequent: children,
  }),
);

setVisitor(
  'SwitchStatement',
  (node, location) => [
    visit(node.discriminant, location),
    node.cases.map((child) => visit(child, location)),
  ],
  (node, location, child, children) => ({
    type: 'SwitchStatement',
    discriminant: child,
    cases: children,
  }),
);
