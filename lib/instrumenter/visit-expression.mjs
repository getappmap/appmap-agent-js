
import Logger from '../logger.mjs';
import Dummy from './dummy.mjs';
import visitPattern from "./visit-pattern.mjs";
import visitClass from "./visit-class.mjs";
import visitClosure from "./visit-closure.mjs";

const logger = new Logger(import.meta.url);
const getEntities = ({entities}) => entities;
const getNode = ({node}) => node;

export default const visitExpression = (node, location, context) => {
  if (node.type in visitors) {
    return visitors[node.type](node, location, context);
  }
  logger.error(`Invalid expression node, got: ${node.type}`);
  return {
    node: Dummy.getIdentifierNode(),
    entities: []
  };
};

///////////
// Other //
///////////

const visitTemplateElement = (node, location) => ({
  type: "TemplateElement",
  tail: node.tail,
  value: {
    cooked: node.value.cooked,
    raw: node.value.raw
  }
});

const visitSpreadableExpression = (node, location) => {
  if (node.type === "SpreadElement") {
    return {
      type: "SpreadElement",
      argument: visitExpression(node.argument, location, Context.getVoidContext())
    };
  }
  visitExpression(node, location);
};

export const visitMemberProperty = (node, location, computed) => {
  if (computed) {
    return visitExpression(node, location, Context.getVoidContext());
  }
  if (node.type === "Identifier") {
    return {
      type: "Identifier",
      name: node.name
    };
  }
  logger.error(`Invalid non-computed member property node, got: ${node.type}`);
  return Dummy.getIdentifierNode();
};

////////////////
// Expression //
////////////////

const visitors = {
  __proto__: null,
  // Literal //
  Literal: (node, location, context) => {
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
  TemplateLiteral: (node, location, context) => {
    const pairs1 = node.quasis.map((node) => visitTemplateElement(node, location));
    const pairs2 = node.expressions.map((node) => visitExpression(node, location, Context.getVoidContext()));
    return {
      node: {
        type: "TemplateLiteral",
        quasis: pairs1.map(getNode),
        expressions: pairs2.map(getNode)
      },
      entities: [...pairs1.flatMap(getEntities), ...pairs2.flatMap(getEntities)]
    };
  },
  TaggedTemplateExpression: (node, location, context) => {
    const pair1 = visitExpression(node.tag, location, Context.getVoidContext());
    const pair2 = visitExpression(node.quasi, location, Context.getVoidContext());
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
  ThisExpression: (node, location, context) => ({
    node: {
      type: "ThisExpression"
    },
    entities: []
  }),
  SuperExpression: (node, location, context) => ({
    node: {
      type: "Super"
    },
    entities: []
  }),
  Identifier: (node, location, context) => {
    location.getNamespace().checkIdentifierCollision(node.name);
    return {
      node: {
        type: "Identifier",
        name: node.name
      },
      entities: []
    };
  },
  AssignmentExpression: (node, location, context1) => {
    let context2 = Context.getVoidContext();
    if (node.left.type === "Identifier" && node.operator === "=") {
      context2 = new Naming.VariableNaming(node.left, "assignment");
    }
    const pair1 = visitPattern(node.left, location);
    const pair2 = visitExpression(node.right, location, context2);
    return {
      node: {
        type: "AssignmentExpression",
        operator: node.operator,
        left: pair1.node,
        right: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  UpdateExpression: (node, location, context) => {
    const pair = visitPattern(node.test, location);
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
  AwaitExpression: (node, location, context) => {
    const pair = visitExpression(node.argument, location, Context.getVoidContext());
    return {
      node: {
        type: "AwaitExpression",
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  AwaitExpression: (node, location, context) => {
    const pair = visitExpression(node.argument, location, Context.getVoidContext());
    return {
      node: {
        type: "YieldExpression",
        delegate: node.delegate,
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  ConditionalExpression: (node, location, context) => {
    const pair1 = visitExpression(node.test, location, Context.getVoidContext());
    const pair2 = visitExpression(node.consequent, location, Context.getVoidContext());
    const pair3 = visitExpression(node.alternate, location, Context.getVoidContext());
    return {
      node: {
        type: "LogicalExpression",
        test: pair1.node,
        consequent: pair1.node,
        alternate: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities, ...pair3.entities]
    };
  },
  LogicalExpression: (node, location, context) => {
    const pair1 = visitExpression(node.left, location, Context.getVoidContext());
    const pair2 = visitExpression(node.right, location, Context.getVoidContext());
    return {
      node: {
        type: "LogicalExpression",
        operator: node.operator,
        left: pair1.node,
        rigth: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  SequenceExpression: (node, location, context) => {
    const pairs = node.expressions.map((node) => visitExpression(node, location, Context.getVoidContext());
    return {
      node: {
        type: "SequenceExpression",
        expressions: pairs.flatMap(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  },
  // Combination //
  MemberExpression: (node, location, context) => {
    const pair1 = visitExpression(node.object, location, Context.getVoidContext());
    const pair2 = visitMemberProperty(node.property, location, node.computed);
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
  ArrayExpression: (node, location, context) => {
    const pairs = node.elements.map((node) => {
      if (node === null) {
        return {
          node: null,
          entities: []
        };
      }
      return visitSpreadableExpression(node, location);
    });
    return {
      node: {
        type: "ArrayExpression",
        elements: pairs.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  },
  BinaryExpression: (node, location, context) => {
    const pair1 = visitExpression(node.left, location, Context.getVoidContext());
    const pair2 = visitExpression(node.right, location, Context.getVoidContext());
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
  UnaryExpression: (node, location, context) => {
    const pair = visitExpression(node.argument, location, Context.getVoidContext());
    return {
      node: {
        type: "UnaryExpression",
        operator: node.operator,
        prefix: node.prefix // always true
        argument: pair.expression
      },
      entities: pair.entities
    };
  },
  CallExpression: (node, location, context) => {
    const pair = visitExpression(node.callee, location, Context.getVoidContext());
    const pairs = node.arguments.map((node) => visitSpreadableExpression(node, location));
    return {
      node: {
        type: "CallExpression",
        callee: pair.node;
        arguments: pairs.map(getNode)
      },
      entities: [...pair.entities, ...pairs.flatMap(getEntities)]
    };
  },
  NewExpression: (node, location, context) => {
    const pair = visitExpression(node.callee, location, Context.getVoidContext());
    const pairs = node.arguments.map((node) => visitSpreadableExpression(node, location));
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
