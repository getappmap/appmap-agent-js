
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
  logger.error(`Invalid non-computed member property node`);
  return {
    type: "Literal",
    value: "APPMAP_ERROR"
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
        node: {
          type: "Literal",
          value: null,
          regex: {
            pattern: node.regex.pattern,
            flags: node.regex.flags
          }
        },
        entities: []
      };
    }
    return {
      node: {
        type: "Literal",
        value: node.value
      },
      entities: []
    };
  },
  TemplateLiteral: (node, context, naming) => {
    const pairs1 = node.quasis.map((node) => visitTemplateElement(node, context));
    const pairs2 = node.expressions.map((node) => visitExpression(node, context, Naming.getVoidNaming));
    return {
      node: {
        type: "TemplateLiteral",
        quasis: pairs1.map(getNode),
        expressions: pairs2.map(getNode)
      },
      entities: [...pairs1.flatMap(getEntities), ...pairs2.flatMap(getEntities)]
    };
  }),
  TaggedTemplateExpression: (node, context, naming) => {
    const pair1 = visitExpression(node.tag, context, Naming.getVoidNaming());
    const pair2 = visitors.TemplateLiteral(node.quasi, context, Naming.getVoidNaming());
    return {
      node: {
        type: "TaggedTemplateExpression",
        tag: pair1.node,
        quasi: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  ClassExpression: visitClass,
  ArrowFunctionExpression: visitClosure,
  FunctionExpression: visitClosure,
  // Environment //
  ThisExpression: (node, context, naming) => ({
    node: {
      type: "ThisExpression"
    },
    entities: []
  }),
  SuperExpression: (node, context, naming) => ({
    node: {
      type: "Super"
    },
    entities: []
  }),
  Identifier: (node, context, naming) => {
    if (node.name.startsWith(context.prefix)) {
      logger.error(`Base-level identifier should not start with escaping prefix: ${context.prefix}, got: ${node.name}`);
    };
    return {
      node: {
        type: "Identifier",
        name: node.name
      },
      entities: []
    };
  },
  AssignmentExpression: (node, context, naming) => {
    naming = Naming.getVoidNaming();
    if (node.left.type === "Identifier" && node.operator === "=") {
      naming = new Naming.VariableNaming(node.left, "assignment");
    }
    const pair1 = visitPattern(node.left, context);
    const pair2 = visitExpression(node.right, context, naming);
    return {
      node: {
        type: "AssignmentExpression",
        prefix: true,
        operator: node.operator,
        left: pair1.node,
        right: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  UpdateExpression: (node, context, naming) => {
    const pair = visitPattern(node.test, context);
    return {
      node: {
        type: "UpdateExpression",
        prefix: node.prefix,
        operator: node.operator,
        argument: pair.node
      },
      entities: pair.entities;
    };
  },
  // Control //
  ConditionalExpression: (node, context, naming) => {
    const pair1 = visitExpression(node.test, context, Naming.getVoidNaming());
    const pair2 = visitExpression(node.consequent, context, Naming.getVoidNaming());
    const pair3 = visitExpression(node.alternate, context, Naming.getVoidNaming());
    return {
      node: {
        type: "LogicalExpression",
        test: pair1.node,
        consequent: pair1.node
        alternate: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities, ...pair3.entities]
    };
  },
  LogicalExpression: (node, context, naming) => {
    const pair1 = visitExpression(node.left, context, Naming.getVoidNaming());
    const pair2 = visitExpression(node.right, context, Naming.getVoidNaming());
    return {
      node: {
        type: "LogicalExpression",
        operator: node.operator,
        left: pair1.node
        rigth: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  SequenceExpression: (node, context, naming) => {
    const pairs = node.expressions.map((node) => visitExpression(node, context, Naming.getVoidNaming());
    return {
      node: {
        type: "SequenceExpression",
        expressions: pairs.flatMap(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  },
  // Combination //
  MemberExpression: (node, context, naming) => {
    const pair1 = visitExpression(node.object, context, Naming.getVoidNaming());
    const pair2 = visitExpression(node.property, context, node.computed);
    return {
      node: {
        type: "MemberExpression",
        computed: node.computed,
        object: pair1.node,
        property: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  ObjectExpression: visitObject,
  ArrayExpression: (node, context, naming) => {
    const pairs = node.elements.map((node) => {
      if (node === null) {
        return {
          node: null,
          entities: []
        };
      }
      return visitSpreadableExpression(node, context);
    });
    return {
      node: {
        type: "ArrayExpression",
        elements: pairs.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  },
  BinaryExpression: (node, context, naming) => {
    const pair1 = visitExpression(node.left, context, Naming.getVoidNaming());
    const pair2 = visitExpression(node.right, context, Naming.getVoidNaming());
    return {
      node: {
        type: "BinaryExpression",
        operator: node.operator,
        left: pair1.node
        rigth: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  UnaryOperation: (node, context, naming) => {
    const pair = visitExpression(node.argument, context, Naming.getVoidNaming());
    return {
      node: {
        type: "UnaryOperation",
        operator: node.operator,
        argument: pair.expression
      },
      entities: pair.entities
    };
  },
  CallExpression: (node, context, naming) => {
    const pair = visitExpression(node.callee, context, Naming.getVoidNaming());
    const pairs = node.arguments.map((node) => visitSpreadableExpression(node, context));
    return {
      node: {
        type: "CallExpression",
        callee: pair.node;
        arguments: pairs.map(getNode)
      },
      entities: [...pair.entities, ...pairs.flatMap(getEntities)]
    };
  },
  NewExpression: (node, context, naming) => {
    const pair = visitExpression(node.callee, context, Naming.getVoidNaming());
    const pairs = node.arguments.map((node) => visitSpreadableExpression(node, context));
    return {
      node: {
        type: "NewExpression",
        callee: pair.node;
        arguments: pairs.map(getNode)
      },
      entities: [...pair.entities, ...pairs.flatMap(getEntities)]
    };
  }
};