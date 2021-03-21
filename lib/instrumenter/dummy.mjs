export const getClassEntity = () => ({
  type: 'class',
  name: '__APPMAP_ERROR__',
  childeren: [],
});

export const getIdentifierNode = () => ({
  type: 'Identifier',
  name: '__APPMAP_ERROR__',
});

export const getReturnStatementNode = () => ({
  type: "ReturnStatement",
  argument: getIdentifierNode()
});

export const getFunctionExpressionNode = () => ({
  type: 'FunctionExpression',
  async: false,
  generator: false,
  id: null,
  params: [getIdentifierNode()],
  body: {
    type: "BlockStatement",
    body: []
  }
});

export const getMethodDefinitionNode = () => ({
  type: 'MethodDefinition',
  kind: 'method',
  computed: false,
  static: false,
  key: getIdentifierNode(),
  value: getFunctionExpressionNode()
});

export const getClassBodyNode = () => ({
  type: 'ClassBody',
  body: [getMethodDefinitionNode()]
});

export const getClassExpressionNode = () => ({
  type: "ClassExpression",
  superClass: null,
  body: getClassBodyNode()
});

export const getPropertyNode = () => ({
  type: 'Property',
  kind: 'init',
  method: false,
  shorthand: false,
  computed: false,
  key: getIdentifierNode(),
  value: getIdentifierNode(),
});

export const getObjectExpressionNode = () => ({
  type: 'ObjectExpression',
  properties: [getPropertyNode()],
});
