import dummify from './dummify.mjs';

export const visitName = (node, location) => {
  if (node.type === 'Identifier') {
    return {
      node: {
        type: 'Identifier',
        name: node.name,
      },
      entities: [],
    };
  }
  return dummify('Name', node);
};
