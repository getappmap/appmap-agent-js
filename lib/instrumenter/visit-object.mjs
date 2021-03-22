
import makeVisit from "./make-visit.mjs";
import {visitKey} from "./visit-key.mjs";
import {visitExpression} from "./visit-expression.mjs";
import {visitFunctionExpression} from "./visit-closure.mjs";

const getEntities = ({entities}) => entities;
const getNode = ({node}) => node;

const visitProperty = makeVisit("Property", {
  __proto__: null,
  SpreadElement: (node, location) => {
    const pair = visitExpression(node.argument, location);
    return {
      node: {
        type: "SpreadElement",
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  Property: (node, location) => {
    let pair1;
    if (node.computed) {
      pair1 = visitExpression(node, location);
    } else {
      pair1 = visitKey(node.key, location);
    }
    let pair2;
    if (node.kind !== "init" || node.method) {
      pair2 = visitFunctionExpression(node.value, location);
    } else {
      pair2 = visitExpression(node.value, location);
    }
    return {
      node: {
        type: "Property",
        kind: node.kind,
        method: node.method,
        shorthand: false,
        key: pair1.node,
        value: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  }
});

export const getObjectExpressionVisitor = (node, location) => {
  const pairs = node.properties.map((child) => visitProperty(child, location));
  return {
    node: {
      type: "ObjectExpression",
      properties: pairs.map(getNode)
    },
    entities: [location.makeEntity(pairs.flatMap(getEntities))]
  };
};
