import { constant } from "../../../util/index.mjs";
import { setVisitor, visit, getEmptyVisitResult } from "./visit.mjs";

const getEmptyArray = constant([]);

////////////
// Atomic //
////////////

// ReturnStatement cf visit-closure.mjs

setVisitor("EmptyStatement", getEmptyArray, (node, context) => ({
  type: "EmptyStatement",
}));

setVisitor(
  "ThrowStatement",
  (node, context) => [visit(node.argument, context, node)],
  (node, context, child) => ({
    type: "ThrowStatement",
    argument: child,
  }),
);

setVisitor(
  "ExpressionStatement",
  (node, context) => [visit(node.expression, context, node)],
  (node, context, child) => ({
    type: "ExpressionStatement",
    expression: child,
  }),
);

setVisitor("DebuggerStatement", getEmptyArray, (node, context) => ({
  type: "DebuggerStatement",
}));

setVisitor(
  "BreakStatement",
  (node, context) => [
    node.label === null
      ? getEmptyVisitResult()
      : visit(node.label, context, node),
  ],
  (node, context, child) => ({
    type: "BreakStatement",
    label: child,
  }),
);

setVisitor(
  "ContinueStatement",
  (node, context) => [
    node.label === null
      ? getEmptyVisitResult()
      : visit(node.label, context, node),
  ],
  (node, context, child) => ({
    type: "ContinueStatement",
    label: child,
  }),
);

/////////////////
// Declaration //
/////////////////

// FunctionDeclaration cf visit-common-closure.mjs
// ClassDeclaration cf visit-common-class.mjs

setVisitor(
  "VariableDeclarator",
  (node, context) => [
    visit(node.id, context),
    node.init === null
      ? getEmptyVisitResult()
      : visit(node.init, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "VariableDeclarator",
    id: child1,
    init: child2,
  }),
);

setVisitor(
  "VariableDeclaration",
  (node, context) => [
    node.declarations.map((child) => visit(child, context, node)),
  ],
  (node, context, children) => ({
    type: "VariableDeclaration",
    kind: node.kind,
    declarations: children,
  }),
);

setVisitor(
  "ImportSpecifier",
  (node, context) => [
    visit(node.local, context, node),
    visit(node.imported, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "ImportSpecifier",
    local: child1,
    imported: child2,
  }),
);

setVisitor(
  "ImportDefaultSpecifier",
  (node, context) => [visit(node.local, context, node)],
  (node, context, child) => ({
    type: "ImportDefaultSpecifier",
    local: child,
  }),
);

setVisitor(
  "ImportNamespaceSpecifier",
  (node, context) => [visit(node.local, context, node)],
  (node, context, child) => ({
    type: "ImportNamespaceSpecifier",
    local: child,
  }),
);

setVisitor(
  "ImportDeclaration",
  (node, context) => [
    node.specifiers.map((child) => visit(child, context, node)),
    visit(node.source, context, node),
  ],
  (node, context, children, child) => ({
    type: "ImportDeclaration",
    specifiers: children,
    source: child,
  }),
);

setVisitor(
  "ExportSpecifier",
  (node, context) => [
    visit(node.local, context, node),
    visit(node.exported, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "ExportSpecifier",
    local: child1,
    exported: child2,
  }),
);

setVisitor(
  "ExportNamedDeclaration",
  (node, context) => [
    node.declaration === null
      ? getEmptyVisitResult()
      : visit(node.declaration, context, node),
    node.specifiers.map((child) => visit(child, context, node)),
    node.source === null
      ? getEmptyVisitResult()
      : visit(node.source, context, node),
  ],
  (node, context, child1, children, child2) => ({
    type: "ExportNamedDeclaration",
    declaration: child1,
    specifiers: children,
    source: child2,
  }),
);

setVisitor(
  "ExportDefaultDeclaration",
  (node, context) => [visit(node.declaration, context, node)],
  (node, context, child) => ({
    type: "ExportDefaultDeclaration",
    declaration: child,
  }),
);

setVisitor(
  "ExportAllDeclaration",
  (node, context) => [visit(node.source, context, node)],
  (node, context, child) => ({
    type: "ExportAllDeclaration",
    source: child,
  }),
);

//////////////
// Compound //
//////////////

setVisitor(
  "BlockStatement",
  (node, context) => [node.body.map((child) => visit(child, context, node))],
  (node, context, children) => ({
    type: "BlockStatement",
    body: children,
  }),
);

setVisitor(
  "WithStatement",
  (node, context) => [
    visit(node.object, context, node),
    visit(node.body, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "WithStatement",
    object: child1,
    body: child2,
  }),
);

setVisitor(
  "LabeledStatement",
  (node, context) => [
    visit(node.label, context, node),
    visit(node.body, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "LabeledStatement",
    label: child1,
    body: child2,
  }),
);

setVisitor(
  "IfStatement",
  (node, context) => [
    visit(node.test, context, node),
    visit(node.consequent, context, node),
    node.alternate === null
      ? getEmptyVisitResult()
      : visit(node.alternate, context, node),
  ],
  (node, context, child1, child2, child3) => ({
    type: "IfStatement",
    test: child1,
    consequent: child2,
    alternate: child3,
  }),
);

setVisitor(
  "CatchClause",
  (node, context) => [
    node.param === null
      ? getEmptyVisitResult()
      : visit(node.param, context, node),
    visit(node.body, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "CatchClause",
    param: child1,
    body: child2,
  }),
);

setVisitor(
  "TryStatement",
  (node, context) => [
    visit(node.block, context, node),
    node.handler === null
      ? getEmptyVisitResult()
      : visit(node.handler, context, node),
    node.finalizer === null
      ? getEmptyVisitResult()
      : visit(node.finalizer, context, node),
  ],
  (node, context, child1, child2, child3) => ({
    type: "TryStatement",
    block: child1,
    handler: child2,
    finalizer: child3,
  }),
);

setVisitor(
  "WhileStatement",
  (node, context) => [
    visit(node.test, context, node),
    visit(node.body, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "WhileStatement",
    test: child1,
    body: child2,
  }),
);

setVisitor(
  "DoWhileStatement",
  (node, context) => [
    visit(node.test, context, node),
    visit(node.body, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "DoWhileStatement",
    test: child1,
    body: child2,
  }),
);

setVisitor(
  "ForStatement",
  (node, context) => [
    node.init === null
      ? getEmptyVisitResult()
      : visit(node.init, context, node),
    node.test === null
      ? getEmptyVisitResult()
      : visit(node.test, context, node),
    node.update === null
      ? getEmptyVisitResult()
      : visit(node.update, context, node),
    visit(node.body, context, node),
  ],
  (node, context, child1, child2, child3, child4) => ({
    type: "ForStatement",
    init: child1,
    test: child2,
    update: child3,
    body: child4,
  }),
);

setVisitor(
  "ForOfStatement",
  (node, context) => [
    visit(node.left, context, node),
    visit(node.right, context, node),
    visit(node.body, context, node),
  ],
  (node, context, child1, child2, child3) => ({
    type: "ForOfStatement",
    await: node.await,
    left: child1,
    right: child2,
    body: child3,
  }),
);

setVisitor(
  "ForInStatement",
  (node, context) => [
    visit(node.left, context, node),
    visit(node.right, context, node),
    visit(node.body, context, node),
  ],
  (node, context, child1, child2, child3) => ({
    type: "ForInStatement",
    left: child1,
    right: child2,
    body: child3,
  }),
);

setVisitor(
  "SwitchCase",
  (node, context) => [
    node.test === null
      ? getEmptyVisitResult()
      : visit(node.test, context, node),
    node.consequent.map((child) => visit(child, context, node)),
  ],
  (node, context, child, children) => ({
    type: "SwitchCase",
    test: child,
    consequent: children,
  }),
);

setVisitor(
  "SwitchStatement",
  (node, context) => [
    visit(node.discriminant, context, node),
    node.cases.map((child) => visit(child, context, node)),
  ],
  (node, context, child, children) => ({
    type: "SwitchStatement",
    discriminant: child,
    cases: children,
  }),
);
