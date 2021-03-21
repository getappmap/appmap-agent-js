
import visitExpression from "./visit-expression.mjs";

const visitProperty = (node, location) => {
  if (node.type === "SpreadElement") {
    const pair = visitExpression(node.argument, location, Context.getVoidContext());
    return {
      node: {
        type: "SpreadElement",
        argument: pair.node
      },
      entities: pair.entities
    };
  }
  if (node.type === "Property") {
    const pair1 = visitKey(node.key, location, node.computed);
    const pair2 = visitExpression(node.value, location, new Context.ObjectKeyContext(node));
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
  logger.error(`Invalid property node, got: ${node.type}`);
  return {
    node: Dummy.getPropertyNode(),
    entities: []
  };
};

export default (node, location1, context) => {
  if (node.type !== "ObjectExpression") {
    logger.error(`Expected an ObjectExpression node, got: ${node.type}`);
    return {
      node: Dummy.getObjectExpressionNode(),
      entities: []
    };
  }
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
};
