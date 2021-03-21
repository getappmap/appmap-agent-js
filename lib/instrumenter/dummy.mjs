export const getClassEntity = () => ({
  type: 'class',
  name: '__APPMAP_ERROR__',
  childeren: [],
});

export const getIdentifierNode = () => ({
  type: 'Identifier',
  name: '__APPMAP_ERROR__',
});

export const getMethodDefinitionNode = () => ({
  type: 'MethodDefinition',
  kind: 'method',
  computed: false,
  static: false,
  key: getIdentifierNode(),
  value: {
    type: 'FunctionExpression',
    id: null,
    params: [],
    generator: false,
    async: false,
    body: {
      type: 'BlockStatement',
      body: [],
    },
  },
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
