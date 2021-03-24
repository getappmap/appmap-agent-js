import { combineResult } from './result.mjs';
import { assignVisitorObject, visitExpression } from './visit.mjs';

{
  const makeLiteral = (node, location) => {
    if (Reflect.getOwnPropertyDescriptor(node, 'regex') !== undefined) {
      return {
        type: 'Literal',
        value: node.value,
        regex: {
          pattern: node.regex.pattern,
          flags: node.regex.flags,
        },
      };
    }
    if (Reflect.getOwnPropertyDescriptor(node, 'bigint') !== undefined) {
      return {
        type: 'Literal',
        value: node.value,
        bigint: node.bigint,
      };
    }
    return {
      type: 'Literal',
      value: node.value,
    };
  };
  const visitor = (node, location) =>
    combineResult(makeLiteral, node, location);
  assignVisitorObject('Literal', { Literal: visitor });
  assignVisitorObject('Expression', { Literal: visitor });
  assignVisitorObject('NonComputedKey', { Literal: visitor });
}

{
  const makeSpreadElement = (node, location, child) => ({
    type: 'SpreadElement',
    argument: child,
  });
  const visitor = (node, location) =>
    combineResult(
      makeSpreadElement,
      node,
      location,
      visitExpression(node.argument, location),
    );
  assignVisitorObject('SpreadableExpression', { SpreadElement: visitor });
  assignVisitorObject('Property', { SpreadElement: visitor });
}

{
  const makeIdentifier = (node, location) => ({
    type: 'Identifier',
    name: node.name,
  });
  {
    const visitor = (node, location) =>
      combineResult(makeIdentifier, node, location);
    assignVisitorObject('NonScopingIdentifier', { Identifier: visitor });
    assignVisitorObject('NonComputedKey', { Identifier: visitor });
  }
  {
    const visitor = (node, location) => {
      location.getNamespace().checkCollision(node.name);
      return combineResult(makeIdentifier, node, location);
    };
    assignVisitorObject('ScopingIdentifier', { Identifier: visitor });
    assignVisitorObject('Expression', { Identifier: visitor });
    assignVisitorObject('Pattern', { Identifier: visitor });
    assignVisitorObject('RestablePattern', { Identifier: visitor });
  }
}
