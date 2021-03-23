
import Logger from "../logger.mjs";

const logger = new Logger(import.meta.url);

const makeErrorMessage = (kind, node, location) => `_APPMAP_ERROR_INVALID_${kind}_GOT_${node.type}_`;

const makeDummyIdentifier = (kind, node, location) => ({
  type: "Identifier",
  name: makeErrorMessage(kind, node, location);
});

const makeDummyLiteral = (kind, node, location) => ({
  type: "Literal",
  value: makeErrorMessage(kind, node, location)
}); 

const makeDummyTemplateElement = (kind, node, location) => ({
  type: "TemplateElement",
  tail: false,
  value: {
    cooked: makeErrorMessage(kind, node, location),
    raw: makeErrorMessage(kind, node, location)
  }
});

const makeDummyProperty = (kind, node, location) => ({
  type: "Property",
  kind: "init",
  method: false,
  computed: false,
  shorthand: true,
  key: makeDummyIdentifier(kind, node, location),
  value: makeDummyIdentifier(kind, node, location)
});

const makeDummyExpressionStatement = (kind, node, location) => ({
  type: "ExpressionStatement",
  expression: makeDummyIdentifier(kind, node, location)
});

const makeDummyProgram = (kind, node, location) => ({
  type: "Program",
  sourceType: "script",
  body: [makeDummyExpressionStatement(kind, node, location)]
});

const makeDummyBlockStatement = (kind, node, location) => ({
  type: "BlockStatement",
  body: [makeDummyExpressionStatement(kind, node, location)]
});

const makeDummyCatchClause = (kind, node, location) => ({
  type: "CatchClause",
  param: [makeDummyIdentifier],
  body: {
    type: "BlockStatement",
    body: []
  }
});

const makeDummyMethodDefinition = (kind, node, location) => ({
  type: "MethodDefinition",
  kind: "method",
  computed: false,
  static: false,
  key: makeDummyIdentifier(kind, node, location),
  value: makeDummyMethod(kind, node, location)
});

const makeDummyClassBody = (kind, node, location) => ({
  type: "ClassBody",
  body: [makeDummyMethodDefinition(kind, node, location)]
});

const makeDummyMethod = (kind, node, location) => ({
  type: "FunctionExpression",
  init: null
  async: false,
  generator: false,
  params: [],
  body: makeDummyBlockStatement(kind, node, location)
});

const makeDummyExportSpecifier = (kind, node, location) => ({
  type: "ExportSpecifier",
  local: makeDummyIdentifier(),
  exported: makeDummyIdentifier()
});

const makeDummyImportSpecifier = (kind, node, location) => ({
  type: "NamedImportSpecifier",
  local: makeDummyIdentifier(),
  imported: makeDummyIdentifier()
});

const mapping = {
  __proto__: null,
  MethodDefinition: {
    visitors: {__proto__:null},
    dummify: makeDummyMethodDefinition
  },
  ClassBody: {
    visitors: {__proto__:null},
    dummify: makeDummyClassBody
  },
  Method: {
    visitors: {__proto__:null},
    dummify: makeDummyMethod
  },
  Expression: {
    visitors: {___proto__:null},
    dummify: makeDummyIdentifier
  },
  SpreadableExpression: {
    visitors: {___proto__:null},
    dummify: makeDummyIdentifier
  },
  TemplateElement: {
    visitors: {___proto__:null},
    dummify: makeDummyTemplateElement
  },
  NonComputedMemberProperty: {
    visitors: {___proto__:null},
    dummify: makeDummyIdentifier
  },
  DeclarativeIdentifier: {
    visitors: {___proto__:null},
    dummify: makeDummyIdentifier
  },
  NoneDeclarativeIdentifier: {
    visitors: {___proto__:null},
    dummify: makeDummyIdentifier
  },
  NonComputedKey: {
    visitors: {___proto__:null},
    dummify: makeDummyIdentifier
  },
  ObjectProperty: {
    visitors: {___proto__:null},
    dummify: makeDummyProperty
  },
  PatternProperty: {
    visitors: {___proto__:null},
    dummify: makeDummyProperty
  },
  Pattern: {
    visitors: {__proto__:null},
    dummify: makeDummyIdentifier
  },
  RestablePattern: {
    visitors: {__proto__:null},
    dummify: makeDummyIdentifier
  },
  Program: {
    visitors: {__proto__:null},
    dummify: makeDummyProgram
  },
  SwitchCase: {
    visitors: {__proto__:null},
    dummify: makeDummySwitchCase
  },
  BlockStatement: {
    visitors: {__proto__:null},
    dummify: makeDummyBlockStatement
  },
  CatchClause: {
    {__proto__:null},
    dummify: makeDummyCatchClause
  },
  VariableDeclarator: {
    visitors: {__proto__:null},
    dummify: makeDummyVariableDeclarator
  },
  ImportSpecifier: {
    visitors: {__proto__:null},
    dummify: makeDummyImportSpecifier
  },
  ExportSpecifier: {
    visitors: {__proto__:null},
    dummify: makeDummyExportSpecifier
  },
  Source: {
    visitors: {__proto__:null},
    dummify: makeDummyLiteral
  },
  Statement: {
    visitors: {__proto__:null},
    dummify: makeDummyExpressionStatement
  }
};

export const assignVisitorObject = (kind, visitors) => {
  Object.assign(mapping[kind].visitors, visitors);
};

const makeVisit = (kind) => {
  const {visitors, dummify} = mapping[kind];
  return (node, location) => {
    if (node.type in visitors) {
      const location2 = location1.extend(kind, node);
      if (location2.shouldBeInstrumented()) {
        return visitors[node.type](node, location2);
      }
      return {
        node,
        entities: []
      };
    }
    logger.error(`Invalid ${kind} node, got: ${node.type}`);
    return {
      node: dummify(kind, node, location),
      entities: []
    };
  };
};

export const visitMethodDefinition = makeVisit("MethodDefinition");
export const visitClassBody = makeVisit("ClassBody");
export const visitMethod = makeVisit("Method");
export const visitExpression = makeVisit("Expression");
export const visitSpreadableExpression = makeVisit("SpreadableExpression");
export const visitTemplateElement = makeVisit("TemplateElement");
export const visitNonComputedMemberProperty = makeVisit("NonComputedMemberProperty");
export const visitNonComputedKey = makeVisit("NonComputedKey");
export const visitObjectProperty = makeVisit("ObjectProperty");
export const visitPatternProperty = makeVisit("PatternProperty");
export const visitPattern = makeVisit("Pattern");
export const visitRestablePattern = makeVisit("RestablePattern");
export const visitProgram = makeVisit("Program");
export const visitSwitchCase = makeVisit("SwitchCase");
export const visitBlockStatement = makeVisit("BlockStatement");
export const visitCatchClause = makeVisit("CatchClause");
export const visitVariableDeclarator = makeVisit("VariableDeclarator");
export const visitDeclarativeIdentifier = makeVisit("Declarative");
export const visitNonDeclarativeIdentifier = makeVisit("NoneDeclarative");
export const visitImportSpecifier = makeVisit("ImportSpecifier");
export const visitExportSpecifier = makeVisit("ExportSpecifier");
export const visitSource = makeVisit("Source");
export const visitStatement = makeVisit("Statement");
