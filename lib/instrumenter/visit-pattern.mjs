
import {visitKey} from  "./visit-key.mjs";
import {visitExpression, getExpressionVisitorObject} from  "./visit-expression.mjs";

export const visitPattern = makeVisit("Pattern", {
  __proto__: getExpressionVisitorObject(),
  RestElement: (node, location) => {
    const pair = visitPattern(node.argument, location);
    return {
      node: {
        type: "RestElement",
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  Property: (node, location) => {
    let pair1;
    if (node.computed) {
      pair1 = visitExpression(node.key, location);
    } else {
      pair1 = visitKey(node.key, location, node.computed);
    }
    const pair2 = visitPattern(node.value, location);
    return {
      node: {
        type: "Property",
        kind: node.kind, // always "init"
        method: node.method, // always false
        shorthand: node.shorthand,
        computed: node.computed,
        key: pair1.node,
        value: pair2.node
      },
      entities: [...pair1.entities, pair2.entities]
    };
  },
  Identifier: (node, location) => {
    location.getNamespace().checkIdentifierCollision(node.name);
    return {
      node: {
        type: "Identifier",
        name: node.name
      },
      entities: []
    };
  },
  AssignmentPattern: (node, location) => {
    const pair1 = visitPattern(node.left, location);
    const pair2 = visitExpression(node.right, location);
    return {
      node: {
        type: "AssignmentPattern",
        left: pair1.node,
        right: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  ArrayPattern: (node, location) => {
    const pairs = node.elements.map((node) => {
      if (node === null) {
        return {
          node: null,
          entities: []
        };
      }
      return visitPattern(node, location);
    });
    return {
      node: {
        type: "ArrayPattern",
        elements: pairs1.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  },
  ObjectPattern: (node, location) => {
    const pairs = node.properties.map((node) => visitPattern(node, location));
    return {
      node: {
        type: "ObjectPattern",
        properties: pairs.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  }
});
