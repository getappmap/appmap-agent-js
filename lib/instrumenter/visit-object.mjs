
import dummify from './dummify.mjs';
import {getVoidContext, PropertyContext} from "./dummify.mjs";
import {visitExpression} from "./visit-expression.mjs";
import {visitFunctionExpression} from "./visit-closure.mjs";

const getEntities = ({entities}) => entities;
const getNode = ({node}) => node;

const visitProperty = (node, location) => {
  if (node.type === "SpreadElement") {
    const pair = visitExpression(node.argument, location, getVoidContext());
    return {
      node: {
        type: "SpreadElement",
        argument: pair.node
      },
      entities: pair.entities
    };
  }
  if (node.type === "Property") {
    let pair1;
    if (node.computed) {
      pair1 = visitExpression(node, location, getVoidContext());
    } else {
      pair1 = visitKey(node.key, location);
    }
    let pair2;
    if (node.kind !== "init" || node.method) {
      pair2 = visitFunctionExpression(node.value, location, new PropertyContext(node));
    } else3 {
      pair2 = visitExpression(node.value, location, new PropertyContext(node));
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
  return dummify("Property", node);
};

export const visitObjectExpression = (node, location1, context) => {
  if (node.type === "ObjectExpression") {
    const location2 = location.makeDeeperLocation(node, context);
    if (!location2.shouldBeInstrumented()) {
      return {
        node,
        entities: []
      };
    }
    const pairs = node.properties.map((node) => visitProperty(node, location2));
    return {
      node: {
        type: "ObjectExpression",
        properties: pairs.map(getNode)
      },
      entities: [location.makeEntity(pairs.flatMap(getEntities))]
    };
  }
  return dummify("ObjectExpression", node);
};
