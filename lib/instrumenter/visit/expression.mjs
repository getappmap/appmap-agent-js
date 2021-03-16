
import visitPattern from "./pattern.mjs";

export default const visitExpression = (node, context) => visitors[node.type](node, context);

///////////
// Other //
///////////

const visitTemplateElement = (node, context) => ({
  type: "TemplateElement",
  tail: node.tail,
  value: {
    cooked: node.value.cooked,
    raw: node.value.raw
  }
});

const visitSpreadableExpression = (node, context) => {
  if (node.type === "SpreadElement") {
    return {
      type: "SpreadElement",
      argument: visitExpression(node.argument, context)
    }
  }
  visitExpression(node, context);
};

export const visitMemberProperty = (node, context, computed) => {
  if (computed) {
    return visitExpression(node, context);
  }
  if (node.type === "Identifier") {
    return {
      type: "Identifier",
      name: node.name
    };
  }
  logger.error(`Invalid member property node`);
  return {
    type: "Literal",
    value: "APPMAP_ERROR"
  };
};

//////////////
// Property //
//////////////

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

////////////////
// Expression //
////////////////

const visitors = {
  __proto__: null,
  // Literal //
  Literal: (node, context) => {
    if (Reflect.getOwnPropertyDescriptor(node, "regex") !== undefined) {
      return {
        type: "Literal",
        value: null,
        regex: {
          pattern: node.regex.pattern,
          flags: node.regex.flags
        }
      };
    }
    return {
      type: "Literal",
      value: node.value
    };
  },
  TemplateLiteral: (node, context, naming) => ({
    type: "TemplateLiteral",
    quasis: node.quasis.map((node) => visitTemplateElement(node, context)),
    expressions: node.expressions.map((node) => visitExpression(node, context, naming))
  }),
  TaggedTemplateExpression: (node, context, naming) => ({
    type: "TaggedTemplateExpression",
    tag: visitExpression(node.tag, context, null),
    quasi: visitors.TemplateLiteral(node.quasi, context, null)
  }),
  ArrowFunctionExpression: (node, context, naming) => visitClosure(node, context, {type: "expression", naming}),
  FunctionExpression: (node, context, naming) => visitClosure(node, context, {type: "expression", naming}),
  // Environment //
  ThisExpression: (node, context, naming) => ({
    type: "ThisExpression"
  }),
  SuperExpression: (node, context, naming) => ({
    type: "Super"
  }),
  Identifier: (node, context, naming) => ({
    type: "Identifier",
    name: node.name
  }),
  AssignmentExpression: (node, context, naming1) => {
    let naming2 = null;
    if (node.left.type === "Identifier" && node.operator === "=") {
      naming2 = {
        type: "variable",
        kind: null,
        name: node.left.name
      };
    }
    return {
      type: "AssignmentExpression",
      prefix: true,
      operator: node.operator,
      left: visitPattern(node.argument, context, null),
      right: visitExpression(node.argument, context, naming2);
    };
  },
  UpdateExpression: (node, context, naming) => ({
    type: "UpdateExpression",
    prefix: node.prefix,
    operator: node.operator,
    argument: visitPattern(node.argument, context, null)
  }),
  // Control //
  ConditionalExpression: (node, context, naming) => ({
    type: "ConditionalExpression",
    test: visitExpression(node.test, context, null),
    consequent: visitExpression(node.consequent, context, null),
    alternate: visitExpression(node.alternate, context, null)
  }),
  LogicalExpression: (node, context, naming) => ({
    type: "LogicalExpression",
    operator: node.operator,
    left: visitExpression(node.left, context, null),
    right: visitExpression(node.right, context, null)
  }),
  SequenceExpression: (node, context, naming) => ({
    type: "SequenceExpression",
    expressions: node.expressions.map((node) => visitExpression(node, context, null))
  }),
  // Combination //
  MemberExpression: (node, context, naming) => ({
    type: "MemberExpression",
    computed: node.computed,
    object: visitExpression(node.object, context, null),
    property: visitMemberProperty(node.property, context, node.computed)
  }),
  ObjectExpression: (node, context, naming) => ({
    type: "ObjectExpression",
    properties: node.properties.map((node) => visitProperty(node, context, naming))}),
  ArrayExpression: (node, context, naming) => ({
    type: "ArrayExpression",
    elements: node.elements.map((node) => {
      if (node === null) {
        return null;
      }
      return visitSpreadableExpression(node, context);
    });
  }),
  BinaryExpression: (node, context, naming) => ({
    type: "BinaryExpression",
    operator: node.operator,
    left: visitExpression(node.left, context, null),
    rigth: visitExpression(node.right, context, null)
  }),
  UnaryOperation: (node, context, naming) => ({
    type: "UnaryOperation",
    operator: node.operator,
    argument: visitExpression(node.argument, context, naming)
  }),
  CallExpression: (node, context, naming) => ({
    type: "CallExpression",
    callee: visitExpression(node, context, null),
    arguments: node.arguments.map((node) => visitSpreadableExpression(node, context)); 
  }),
  NewExpression: (node, context, naming) => ({
    type: "NewExpression",
    callee: visitExpression(node.callee, context, null),
    arguments: node.arguments.map((node) => visitSpreadableExpression(node, context))
  })
};
