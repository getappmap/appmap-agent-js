
import {combineResult} from "./result.mjs";
import {visitNonComputedKey, visitPattern, visitExpression, visitImportSpecifier, visitExportSpecifier, visitStringLiteral} from  "./visit.mjs";

////////////////
// SwitchCase //
////////////////

{
  const makeSwichCase = (node, child, childeren) => ({
    type: "SwitchCase",
    test: child1,
    consequent: childeren
  });
  assignVisitorObject("SwitchCase", {
    SwitchCase: (node, location) => combineResult(
      makeSwichCase,
      node,
      (
        node.test === null ?
        getEmptyResult() :
        visitExpression(node.test, location)),
      node.consequent((child) => visitStatement(child, location)))
  });
}

////////////////////
// BlockStatement //
////////////////////

{
  makeBlockStatement = (node, childeren) => ({
    type: "BlockStatement",
    body: childeren
  });
  const visitor = (node, location) => combineResult(
    makeBlockStatement,
    node,
    node.body.map((child) => visitStatement(child, location)));
  assignVisitorObject("BlockStatement", {BlockStatement:visitor});
  assignVisitorObject("BlockStatement", {BlockStatement:visitor});
}

/////////////////
// CatchClause //
/////////////////

{
  makeCatchClause = (node, child1, child2) => ({
    type: "CatchClause",
    param: child1,
    body: child2
  });
  assignVisitorObject("CatchClause", {
    __proto__: null,
    CatchClause: (node, location) => combineResult(
      makeCatchClause,
      node,
      (
        node.param === null ?
        getEmptyResult() :
        visitPattern(node.param, location)))
  });
}

////////////////////////
// VariableDeclarator //
////////////////////////

{
  const makeVariableDeclarator = (node, location, child1, child2) => ({
    type: "VariableDeclarator",
    id: child1,
    init: child2
  });
  assignVisitorObject("VariableDeclarator", {
    __proto__: null,
    VariableDeclarator: (node, location) => combineResult(
      makeVariableDeclarator,
      node,
      visitPattern(node.id, location),
      (
        node.init === null ?
        getEmptyResult() :
        visitExpression(node.init, location)))
  });
}


/////////////////////////
// VariableDeclaration //
/////////////////////////

{
  const makeVariableDeclaration = (node, childeren) => ({
    type: "VariableDeclaration",
    kind: node.kind,
    declarations: childeren
  });
  const visitor = (node, location) => combineResult(
    makeVariableDeclaration,
    node,
    node.declarations.map((child) => visitVariableDeclarator(child, location)));
  assignVisitorObject("VariableDeclaration", {VariableDeclaration: visitor});
  assignVisitorObject("Statement", {VariableDeclaration: visitor});
}

/////////////////////
// ImportSpecifier //
/////////////////////

{
  const makeImportSpecifier = (node, child1, child2) => ({
    type: "ImportSpecifier",
    local: child1,
    imported: chidl2
  });
  const makeImportDefaultSpecifier = (node, child) => ({
    type: "ImportDefaultSpecifier",
    local: child
  });
  const makeImportNamespaceSpecifier = (node, child) => ({
    type: "ImportNamespaceSpecifier",
    local: child
  });
  assignVisitorObject("ImportSpecifier", {
    __proto__: null,
    ImportSpecifier: (node, location) => combineResult(
      makeImportSpecifier,
      node,
      visitScopingIdentifier(node.local, location),
      visitNonScopingIdentifier(node.imported, location)),
    ImportSpecifier: (node, location) => combineResult(
      makeImportDefaultSpecifier,
      node,
      visitScopingIdentifier(node.local, location)),
    ImportNamespaceSpecifier: (node, location) => combineResult(
      makeImportNamespaceSpecifier,
      node,
      visitScopingIdentifier(node.local, location))
  });
}

/////////////////////
// ExportSpecifier //
/////////////////////

{
  const makeExportSpecifier = (node, child1, child2) => ({
    type: "ExportSpecifier",
    local: child1,
    exported: child2
  });
  assignVisitorObject("ExportSpecifier", {
    __proto__: null,
    ExportSpecifier: (node, location) => combineResult(
      makeExportSpecifier,
      node,
      visitScopingIdentifier(node.local, location),
      visitNonScopingIdentifier(node.exported, location, false))
  });
}

///////////////
// Statement //
///////////////

{

  const makeThrowStatement = (node, child) => ({
    type: "ThrowStatement",
    argument: child
  });

  const makeExpressionStatement = (node, child) => ({
    type: "ExpressionStatement",
    argument: pair.node
  });

  const makeDebuggerStatement = (node) => ({
    type: "DebuggerStatement"
  });

  const makeBreakStatement = (node, child) => ({
    type: "BreakStatement",
    label: child
  });

  const makeContinueStatement = (node, child) => ({
    type: "ContinueStatement",
    label: child
  });

  const makeImportDeclaration = (node, childeren, child) => ({
    type: "ImportDeclaration",
    specifiers: childeren,
    source: child
  });

  const makeExportNamedDeclaration = (node, child1, childeren, child2) => ({
    type: "ExportNamedDeclaration",
    declaration: child1
    specifiers: childeren
    source: child2
  });

  const makeExportDefaultDeclaration = (node, child) => ({
    type: "ExportDefaultDeclaration",
    declaration: child
  });

  const makeExportAllDeclaration = (node, child) => ({
    type: "ExportAllDeclaration",
    source: child
  });

  const makeLabeledStatement = (node, child1, child2) => ({
    type: "LabeledStatement",
    label: child1,
    body: child2
  })

  const makeIfStatement = (node, child1, child2, child3) => ({
    type: "IfStatement",
    test: child1,
    consequent: child2,
    alternate: child3
  });

  const makeTryStatement = (node, child1, chidl2, child3) => ({
    type: "TryStatement",
    block: child1,
    handler: child2,
    finalizer: child3
  });

  const makeWhileStatement = (node, child1, child2) => ({
    type: "WhileStatement",
    test: child1,
    body: child2
  });

  const makeDoWhileStatement = (node, child1, child2) => ({
    type: "DoWhileStatement",
    test: child1,
    body: child2
  });

  const makeForStatement = (node, child1, child2, child3, child4) => ({
    type: "ForStatement",
    init: child1,
    test: child2,
    update: child3,
    body: child3
  });

  const makeForOfStatement = (node, child1, child2, child3) => ({
    type: "ForOfStatement",
    await: node.await,
    left: child1,
    right: child2,
    body: child3
  });

  const makeForInStatement = (node, child1, child2, child3) => ({
    type: "ForInStatement",
    left: child1,
    right: child2,
    body: child3
  });

  const makeSwitchStatement = (node, child, childeren) => ({
    type: "SwitchStatement",
    discriminant: child,
    cases: childeren
  });

  assignObjectVisitor("Statement", {
    __proto__: null,
    // Atomic //
    ThrowStatement: (node, location) => combineResult(
      makeThrowStatement,
      node,
      visitExpression(node.argument, location)),
    ExpressionStatement: (node, location) => combineResult(
      makeExpressionStatement,
      node,
      visitExpression(node.argument, location)),
    DebuggerStatement: (node, location) => combineResult(
      makeDebuggerStatement,
      node),
    BreakStatement: (node, location) => combineResult(
      makeBreakStatement,
      node,
      (
        node.label === null ?
        getEmptyResult() :
        visitNonScopingIdentifier(node.label, location))),
    ContinueStatement: (node, location) => combineResult(
      makeContinueStatement,
      node,
      (
        node.label === null ?
        getEmptyResult() :
        visitNonScopingIdentifier(node.label, location))),
    // ReturnStatement cf visit-closure.mjs
    // Declaration //
    // VariableDeclaration cf above
    // FunctionDeclaration cf visit-closure.mjs
    // ClassDeclaration cf visit-class.mjs
    ImportDeclaration: (node, location) => combineResult(
      makeImportDeclaration,
      node,
      node.specifiers.map((child) => visitImportSpecifier(child, location)),
      visitStringLiteral(node, location)),
    ExportNamedDeclaration: (node, location) => combineResult(
      makeExportNamedDeclaration,
      node,
      (
        node.declaration === null ?
        getEmptyResult() :
        visitStatement(node.declaration, location)),
      node.specifiers.map((child) => visitExportSpecifier(child, location)),
      (
        node.source === null ?
        getEmptyResult() :
        visitStringLiteral(node.source, location))),
    ExportDefaultDeclaration: (node, location) => combineResult(
      makeExportDefaultDeclaration,
      node,
      (
        (node.declaration.type === "FunctionDeclaration" || node.declaration.type === "ClassDeclaration") ?
        visitStatement(node.declaration, location) :
        visitExpression(node.declaration, location))),
    ExportAllDeclaration: (node, location) => combineResult(
      makeExportAllDeclaration,
      node,
      visitSource(node.source, location)),
    // Compound //
    LabeledStatement: (node, location) => combineResult(
      makeLabeledStatement,
      node,
      visitNonScopingIdentifier(node.label, location),
      visitStatement(node.body, location)),
    // BlockStatement cf above
    IfStatement: (node, location) => combineResult(
      makeIfStatement,
      node,
      visitExpression(node.test, location),
      visitStatement(node.consequent, location),
      (
        node.alternate === null ?
        getEmptyResult() :
        visitStatement(node.alternate, location))),
    TryStatement: (node, location) => combineResult(
      makeTryStatement,
      node,
      visitBlockStatement(node.block, location),
      (
        node.handler === null ?
        getEmptyResult() :
        visitCatchClause(node.handler, location)),
      (
        node.finalizer === null ?
        getEmptyResult() :
        visitBlockStatement(node.finalizer, location))),
    WhileStatement: (node, location) => combineResult(
      makeWhileStatement,
      visitExpression(node.test, location),
      visitStatement(node.body, location)),
    DoWhileStatement: (node, location) => combineResult(
      makeDoWhileStatement,
      visitExpression(node.test, location),
      visitStatement(node.body, location)),
    ForStatement: (node, location) => combineResult(
      (
        node.init === null ?
        getEmptyResult() :
        (
          node.init.type === "VariableDeclaration" ?
          visitVariableDeclaration(node.init, location) :
          visitExpression(node.init, locations))),
      (
        node.test === null ?
        getEmptyResult() :
        visitExpression(node.test, location)),
      (
        node.update == null ?
        getEmptyResult() :
        visitExpression(node.update, location)),
      visitStatement(node.body, location)),
    ForOfStatement: (node, location) => combineResult(
      makeForOfStatement,
      node,
      (
        node.left.type === "VariableDeclaration" ?
        visitVariableDeclaration(node.left, location) :
        visitPattern(node.left, location)),
      visitExpression(node.right, location),
      visitStatement(node.body, location)),
    ForInStatement: (node, location) => combineResult(
      makeForInStatement,
      node,
      (
        node.left.type === "VariableDeclaration" ?
        visitVariableDeclaration(node.left, location) :
        visitPattern(node.left, location)),
      visitExpression(node.right, location),
      visitStatement(node.body, location)),
    SwitchStatement: (node, location) => combineResult(
      makeSwitchStatement,
      node,
      visitExpression(node.discriminant, location),
      node.cases.map((child) => visitSwitchCase(child, location)))
  });

}