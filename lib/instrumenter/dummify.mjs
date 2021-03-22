
import Logger from "../logger.mjs";

const logger = new Logger(import.meta.url);

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
  Identifier: () => ({
    type: 'Identifier',
    name: '__APPMAP_ERROR__',
  }),
  ReturnStatement: () => ({
    type: "ReturnStatement",
    argument: dummies.Identifier()
  }),
  Closure: () => ({
    type: 'FunctionExpression',
    async: false,
    generator: false,
    id: null,
    params: [dummies.Identifier()],
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
    key: dummies.Identifier(),
    value: dummies.Closure()
  }),
  ClassBody: () => ({
    type: 'ClassBody',
    body: [dummies.MethodDefinition()]
  }),
  Class = () => ({
    type: "ClassExpression",
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
