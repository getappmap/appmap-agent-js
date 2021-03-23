import { combineResult } from './result.mjs';
import { assignVisitorObject, visitExpression } from './visit.mjs';

{
  const makeLiteral = (node) => {
    if (
      typeof node.value === 'string' &&
      Reflect.getOwnPropertyDescriptor(node, 'regex') === undefined &&
      Reflect.getOwnPropertyDescriptor(node, 'bigint') === undefined
    ) {
      return {
        type: 'Literal',
        value: node.value,
      };
    }
    throw new Error(`Invalid string literal`);
  };
  const visitor = (node, location) => combineResult(makeLiteral, node);
  assignVisitorObject('StringLiteral', { Literal: visitor });
  assignVisitorObject('NonComputedKey', { Literal: visitor });
}

{
  const makeSpreadElement = (node, child) => ({
    type: 'SpreadElement',
    argument: child,
  });
  const visitor = (node, location) =>
    combineResult(
      makeSpreadElement,
      node,
      visitExpression(node.argument, location),
    );
  assignVisitorObject('SpreadableExpression', { SpreadElement: visitor });
  assignVisitorObject('Property', { SpreadElement: visitor });
}

{
  const makeIdentifier = (node) => ({
    type: 'Identifier',
    name: node.name,
  });
  {
    const visitor = (node, location) => combineResult(makeIdentifier, node);
    assignVisitorObject('NoneScopingIdentifier', { Identifier: visitor });
    assignVisitorObject('NonComputedKey', { Identifier: visitor });
  }
  {
    const visitor = (node, location) => {
      location.getNamespace().checkIdentifierCollision(node.name);
      return combineResult(makeIdentifier, node);
    };
    assignVisitorObject('ScopingIdentifier', { Identifier: visitor });
    assignVisitorObject('Expression', { Identifier: visitor });
    assignVisitorObject('Pattern', { Identifier: visitor });
    assignVisitorObject('RestablePattern', { Identifier: visitor });
  }
}
