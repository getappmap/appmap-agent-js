
import {assignVisitorObject, getVisitorObject} from "./visit.mjs";

assignVisitorObject("ScopingIdentifier", {
  Identifier: (node, location) => {
    location.getNamespace().checkIdentifierCollision(node.name);
    return ({
      node: {
        type: 'Identifier',
        name: node.name,
      },
      entities: [],
    });
  }
});

assignVisitorObject("NoneScopingIdentifier", {
  Identifier: (node, location) => ({
    node: {
      type: 'Identifier',
      name: node.name,
    },
    entities: [],
  }),
});

assignVisitorObject("StringLiteral", {
  Literal: (node, location) => ({
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
    throw new Error(`Invalid string literal`);
  })
});

assignVisitorObject("NonComputedKey", {
  Identifier: getVisitorObject("NoneScopingIdentifier").Identifier,
  Literal: getVisitorObject("StringLiteral").Literal
});

