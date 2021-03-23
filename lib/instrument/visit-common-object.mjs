import { combineResult, encapsulateResult } from './result.mjs';
import {
  assignVisitorObject,
  visitProperty,
  visitMethod,
  visitExpression,
  visitNonComputedKey,
} from './visit.mjs';

{
  const makeProperty = (node, child1, child2) => ({
    type: 'Property',
    kind: node.kind,
    method: node.method,
    shorthand: false,
    key: child1,
    value: child2,
  });
  assignVisitorObject('ObjectProperty', {
    Property: (node, location) =>
      combineResult(
        makeProperty,
        node,
        node.computed
          ? visitExpression(node.key, location)
          : visitNonComputedKey(node.key, location),
        node.kind === 'init'
          ? visitExpression(node.value, location)
          : visitMethod(node.value, location),
      ),
  });
}

{
  const makeObjectExpression = (node, childeren) => ({
    type: 'ObjectExpression',
    properties: childeren,
  });
  assignVisitorObject('Expression', {
    ObjectExpression: (node, location) =>
      encapsulateResult(
        combineResult(
          makeObjectExpression,
          node,
          node.properties.map((child) => visitProperty(child, location)),
        ),
      ),
  });
}
