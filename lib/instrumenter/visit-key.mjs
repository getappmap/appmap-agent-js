
export const visitKey = makeVisit("Key", {
  __proto__: null,
  Identifier: (node, location) => ({
    node: {
      type: 'Identifier',
      name: node.name,
    },
    entities: [],
  }),
  Literal: (node, location) => {
    if (
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
    throw new Error(`Invalid literal non-computed key`);
  }
});
