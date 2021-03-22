
import Logger from "../logger.mjs";

const logger = new Logger(import.meta.url);

const MARKER = "__APPMAP_ERROR__";

export default (name, node) => {
  logger.error(`Invalid ${name} node, got: ${node.type}`);
  if (name in dummies) {
    return {
      node: dummies[name](),
      entities: []
    };
  }
  throw new Error(`No dummy found to continue instrumentation`);
};

const dummies = {
  __proto__: null,
  Key: () => ({
    type: "Identifier",
    name: MARKER
  }),
  MemberProperty: () => ({
    type: "Identifier",
    name: MARKER
  }),
  Expression: () => ({
    type: "Identifier",
    name: MARKER
  }),
  Pattern: () => ({
    type: "Identifier",
    name: MARKER
  }),
  ReturnStatement: () => ({
    type: "ReturnStatement",
    argument: dummies.Expression()
  }),
  FunctionExpression: () => ({
    type: 'FunctionExpression',
    async: false,
    generator: false,
    id: dummies.Pattern(),
    params: [],
    body: {
      type: "BlockStatement",
      body: []
    }
  }),
  ArrowFunctionExpression: () => ({
    type: 'ArrowFunctionExpression',
    expression: false, 
    id: null,
    async: false,
    generator: false,
    params: [dummies.Pattern()],
    body: {
      type: "BlockStatement",
      body: []
    }
  }),
  MethodDefinition: () => ({
    type: 'MethodDefinition',
    kind: 'method',
    computed: false,
    static: false,
    key: dummies.Key(),
    value: dummies.FunctionExpression()
  }),
  ClassBody: () => ({
    type: 'ClassBody',
    body: [dummies.MethodDefinition()]
  }),
  ClassExpression: () => ({
    type: "ClassExpression",
    superClass: null,
    body: dummies.ClassBody()
  }),
  ClassDeclaration: () => ({
    type: "ClassDeclaration",
    superClass: null,
    body: dummies.ClassBody()
  }),
  Property = () => ({
    type: 'Property',
    kind: 'init',
    method: false,
    shorthand: false,
    computed: false,
    key: dummies.Identifier(),
    value: dummies.Identifier(),
  }),
  ObjectExpression = () => ({
    type: 'ObjectExpression',
    properties: [dummies.Property()],
  })
};
