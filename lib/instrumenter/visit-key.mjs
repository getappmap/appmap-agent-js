import dummify from './dummify.mjs';

export const visitKey = (node, location) => {
  if (node.type === 'Identifier') {
    return {
      node: {
        type: 'Identifier',
        name: node.name,
      },
      entities: [],
    };
  }
  if (
    node.type === 'Literal' &&
    typeof node.value === 'string' &&
    Reflect.getOwnPropertyDescriptor(node, 'regex') === undefined
  ) {
    return {
      node: {
        type: 'Literal',
        value: node.value,
      },
      entities: [],
    };
  }
  return dummify('Key', node);
};
