
export const visitName = makeVisit("Name", {
  __proto__: null,
  Identifier: (node, location) => ({
    node: {
      type: 'Identifier',
      name: node.name,
    },
    entities: [],
  })
});
