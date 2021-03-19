
const visitPropertyKey = (node, context, computed) => {
  if (computed) {
    return visitExpression(node, context);
  }
  if (node.type === "Identifier") {
    return {
      type: "Identifier",
      name: node.name
    };
  }
  if (node.type === "Literal" && typeof node.value === "string") {
    return {
      type: "Literal",
      value: node.value
    };
  }
  logger.error(`Invalid non-computed property-key node`);
  return {
    type: "Literal",
    name: "APPMAP-ERROR"
  };
};

const visitPropertyValue = (node, context, options) => {
  if (node.type === "ArrowFunctionExpression") {
    return visitClosure(node, context, {type: "ArrowPropertyValue", ...options});
  }
  if (node.type === "FunctionExpression") {
    return visitClosure(node, context, {type: "FunctionPropertyValue", ...options});
  }
  return visitExpression(node, context);
};

const visitProperty = (node, context, naming1) => {
  if (node.type === "SpreadElement") {
    return {
      type: "SpreadElement",
      argument: visitExpression(node.argument, context)
    };
  }
  if (node.type === "Property") {
    const naming2 = {
      type: "property",
      name: null
    };
    if (node.key.type === "Literal" && typeof node.key.value === "string") {
      name = node.key.value;
    } else if (!node.computed && node.key.type === "Identifier") {
      name = node.key.name;
    }
    return {
      type: "Property",
      kind: node.kind,
      method: node.method,
      shorthand: false,
      key: visitPropertyKey(node.key, context, node.computed),
      value: visitPropertyValue(node.key, context, {method:node.method, kind:node.kind, name});
    };
  }
  logger.error(`Invalid property node`);
  return {
    type: "Property",
    kind: "init",
    method: false,
    shorthand: false,
    key: {
      type: "Identifier",
      name: "APPMAP_ERROR"
    },
    value: {
      type: "Literal",
      value: "APPMAP_ERROR"
    }
  };
};

export default (node, context, naming) => {
  const location = new Location(node, context.getFile(), naming);
  if (!context.isInstrumentable(location)) {
    return {
      node,
      entities: []
    };
  }
  const deeper = context.makeDeeperContext(location);
  const pairs = node.properties.map((node) => visitProperty(node, deeper, naming));
  return {
    node: {
      type: "ObjectExpression",
      properties: pairs.map(getNode)
    },
    entities: [location.makeEntity(pairs.flatMap(getEntities))]
  };
};
