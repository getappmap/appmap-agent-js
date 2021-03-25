import Logger from '../logger.mjs';

const logger = new Logger(import.meta.url);

const makeErrorMessage = (kind, node, location) =>
  `_APPMAP_ERROR_INVALID_${kind}_GOT_${node.type}_`;

const makeDummyIdentifier = (kind, node, location) => ({
  type: 'Identifier',
  name: makeErrorMessage(kind, node, location),
});

const makeDummyLiteral = (kind, node, location) => ({
  type: 'Literal',
  value: makeErrorMessage(kind, node, location),
});

const makeDummyTemplateElement = (kind, node, location) => ({
  type: 'TemplateElement',
  tail: true,
  value: {
    cooked: makeErrorMessage(kind, node, location),
    raw: makeErrorMessage(kind, node, location),
  },
});

const makeDummyProperty = (kind, node, location) => ({
  type: 'Property',
  kind: 'init',
  method: false,
  computed: false,
  shorthand: true,
  key: makeDummyIdentifier(kind, node, location),
  value: makeDummyIdentifier(kind, node, location),
});

const makeDummyExpressionStatement = (kind, node, location) => ({
  type: 'ExpressionStatement',
  expression: makeDummyIdentifier(kind, node, location),
});

const makeDummyProgram = (kind, node, location) => ({
  type: 'Program',
  sourceType: 'script',
  body: [makeDummyExpressionStatement(kind, node, location)],
});

const makeDummyBlockStatement = (kind, node, location) => ({
  type: 'BlockStatement',
  body: [makeDummyExpressionStatement(kind, node, location)],
});

const makeDummyCatchClause = (kind, node, location) => ({
  type: 'CatchClause',
  param: [makeDummyIdentifier],
  body: {
    type: 'BlockStatement',
    body: [],
  },
});

const makeDummyMethod = (kind, node, location) => ({
  type: 'FunctionExpression',
  init: null,
  async: false,
  generator: false,
  params: [],
  body: makeDummyBlockStatement(kind, node, location),
});

const makeDummyMethodDefinition = (kind, node, location) => ({
  type: 'MethodDefinition',
  kind: 'method',
  computed: false,
  static: false,
  key: makeDummyIdentifier(kind, node, location),
  value: makeDummyMethod(kind, node, location),
});

const makeDummyClassBody = (kind, node, location) => ({
  type: 'ClassBody',
  body: [makeDummyMethodDefinition(kind, node, location)],
});

const makeDummyExportSpecifier = (kind, node, location) => ({
  type: 'ExportSpecifier',
  local: makeDummyIdentifier(kind, node, location),
  exported: makeDummyIdentifier(kind, node, location),
});

const makeDummyImportSpecifier = (kind, node, location) => ({
  type: 'NamedImportSpecifier',
  local: makeDummyIdentifier(kind, node, location),
  imported: makeDummyIdentifier(kind, node, location),
});

const makeDummySwitchCase = (kind, node, location) => ({
  type: 'SwitchCase',
  test: makeDummyIdentifier(kind, node, location),
  consequent: [],
});

const makeDummyVariableDeclarator = (kind, node, location) => ({
  type: 'VariableDeclarator',
  id: makeDummyIdentifier(kind, node, location),
  init: null,
});

const makeDummyVariableDeclaration = (kind, node, location) => ({
  type: 'VariableDeclaration',
  kind: 'var',
  declarations: [makeDummyVariableDeclarator(kind, node, location)],
});

const makeDummyTemplateLiteral = (kind, node, location) => ({
  type: 'TemplateLiteral',
  quasis: [makeDummyTemplateElement(kind, node, location)],
  expressions: [],
});

const mapping = {
  __proto__: null,
  MethodDefinition: {
    visitors: { __proto__: null },
    dummify: makeDummyMethodDefinition,
  },
  ClassBody: {
    visitors: { __proto__: null },
    dummify: makeDummyClassBody,
  },
  Method: {
    visitors: { __proto__: null },
    dummify: makeDummyMethod,
  },
  Expression: {
    visitors: { ___proto__: null },
    dummify: makeDummyIdentifier,
  },
  SpreadableExpression: {
    visitors: { ___proto__: null },
    dummify: makeDummyIdentifier,
  },
  TemplateElement: {
    visitors: { ___proto__: null },
    dummify: makeDummyTemplateElement,
  },
  TemplateLiteral: {
    visitors: { ___proto__: null },
    dummify: makeDummyTemplateLiteral,
  },
  NonComputedMemberProperty: {
    visitors: { ___proto__: null },
    dummify: makeDummyIdentifier,
  },
  ScopingIdentifier: {
    visitors: { ___proto__: null },
    dummify: makeDummyIdentifier,
  },
  NonScopingIdentifier: {
    visitors: { ___proto__: null },
    dummify: makeDummyIdentifier,
  },
  NonComputedKey: {
    visitors: { ___proto__: null },
    dummify: makeDummyIdentifier,
  },
  Property: {
    visitors: { ___proto__: null },
    dummify: makeDummyProperty,
  },
  PropertyPattern: {
    visitors: { ___proto__: null },
    dummify: makeDummyProperty,
  },
  RestablePropertyPattern: {
    visitors: { ___proto__: null },
    dummify: makeDummyIdentifier,
  },
  Pattern: {
    visitors: { __proto__: null },
    dummify: makeDummyIdentifier,
  },
  RestablePattern: {
    visitors: { __proto__: null },
    dummify: makeDummyIdentifier,
  },
  Program: {
    visitors: { __proto__: null },
    dummify: makeDummyProgram,
  },
  SwitchCase: {
    visitors: { __proto__: null },
    dummify: makeDummySwitchCase,
  },
  BlockStatement: {
    visitors: { __proto__: null },
    dummify: makeDummyBlockStatement,
  },
  CatchClause: {
    visitors: { __proto__: null },
    dummify: makeDummyCatchClause,
  },
  VariableDeclarator: {
    visitors: { __proto__: null },
    dummify: makeDummyVariableDeclarator,
  },
  VariableDeclaration: {
    visitors: { __proto__: null },
    dummify: makeDummyVariableDeclaration,
  },
  ImportSpecifier: {
    visitors: { __proto__: null },
    dummify: makeDummyImportSpecifier,
  },
  ExportSpecifier: {
    visitors: { __proto__: null },
    dummify: makeDummyExportSpecifier,
  },
  Statement: {
    visitors: { __proto__: null },
    dummify: makeDummyExpressionStatement,
  },
  Literal: {
    visitors: { __proto__: null },
    dummify: makeDummyLiteral,
  },
};

export const assignVisitorObject = (kind, visitors) => {
  if (!(kind in mapping)) {
    console.log("assignVisitorObject", kind);
  }
  Object.assign(mapping[kind].visitors, visitors);
};

export const visit = (kind, node, location1) => {
  if (!(kind in mapping)) {
    console.log("visit", kind);
  }
  const { visitors, dummify } = mapping[kind];
  const location2 = location1.extend(kind, node);
  if (node.type in visitors) {
    if (location2.shouldBeInstrumented()) {
      return visitors[node.type](node, location2);
    }
    return {
      node,
      entities: [],
    };
  }
  logger.error(`Invalid ${kind} node, got: ${node.type}`);
  return {
    node: dummify(kind, node, location2),
    entities: [],
  };
};

// To revert:
// visit([a-zA-Z]+)\(
// visit("$1",

// export const visitMethodDefinition = makeVisit('MethodDefinition');
// export const visitClassBody = makeVisit('ClassBody');
// export const visitMethod = makeVisit('Method');
// export const visitExpression = makeVisit('Expression');
// export const visitSpreadableExpression = makeVisit('SpreadableExpression');
// export const visitTemplateElement = makeVisit('TemplateElement');
// export const visitTemplateLiteral = makeVisit('TemplateLiteral');
// export const visitNonComputedMemberProperty = makeVisit(
//   'NonComputedMemberProperty',
// );
// export const visitNonComputedKey = makeVisit('NonComputedKey');
// export const visitProperty = makeVisit('Property');
// export const visitPropertyPattern = makeVisit('PropertyPattern');
// export const visitRestablePropertyPattern = makeVisit(
//   'RestablePropertyPattern',
// );
// export const visitPattern = makeVisit('Pattern');
// export const visitRestablePattern = makeVisit('RestablePattern');
// export const visitProgram = makeVisit('Program');
// export const visitSwitchCase = makeVisit('SwitchCase');
// export const visitBlockStatement = makeVisit('BlockStatement');
// export const visitCatchClause = makeVisit('CatchClause');
// export const visitVariableDeclarator = makeVisit('VariableDeclarator');
// export const visitVariableDeclaration = makeVisit('VariableDeclaration');
// export const visitScopingIdentifier = makeVisit('ScopingIdentifier');
// export const visitNonScopingIdentifier = makeVisit('NonScopingIdentifier');
// export const visitImportSpecifier = makeVisit('ImportSpecifier');
// export const visitExportSpecifier = makeVisit('ExportSpecifier');
// export const visitLiteral = makeVisit('Literal');
// export const visitStatement = makeVisit('Statement');
