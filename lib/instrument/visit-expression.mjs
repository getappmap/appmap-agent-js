
import makeVisit from "./make-visit.mjs";
import {visitPattern} from "./visit-pattern.mjs";
import {getObjectExpressionVisitor} from "./visit-object.mjs";
import {getClassExpressionVisitor} from "./visit-class.mjs";
import {getFunctionExpressionVisitor, getArrowFunctionExpressionVisitor} from "./visit-closure.mjs";

const getEntities = ({entities}) => entities;
const getNode = ({node}) => node;

const visitors = {
  __proto__: null,
  // Literal //
  Literal: (node, location) => {
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
  TemplateLiteral: (node, location) => {
    const pairs1 = node.quasis.map((child) => visitTemplateElement(child, location));
    const pairs2 = node.expressions.map((child) => visitExpression(child, location));
    return {
      node: {
        type: "TemplateLiteral",
        quasis: pairs1.map(getNode),
        expressions: pairs2.map(getNode)
      },
      entities: [...pairs1.flatMap(getEntities), ...pairs2.flatMap(getEntities)]
    };
  },
  TaggedTemplateExpression: (node, location) => {
    const pair1 = visitExpression(node.tag, location);
    const pair2 = visitExpression(node.quasi, location);
    return {
      node: {
        type: "TaggedTemplateExpression",
        tag: pair1.node,
        quasi: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  ClassExpression: getClassExpressionVisitor(),
  ArrowFunctionExpression: getArrowFunctionExpressionVisitor(),
  FunctionExpression: getFunctionExpressionVisitor(),
  // Environment //
  ThisExpression: (node, location) => ({
    node: {
      type: "ThisExpression"
    },
    entities: []
  }),
  SuperExpression: (node, location) => ({
    node: {
      type: "Super"
    },
    entities: []
  }),
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
  AssignmentExpression: (node, location) => {
    const pair1 = visitPattern(node.left, location);
    const pair2 = visitExpression(node.right, location);
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
  UpdateExpression: (node, location) => {
    const pair = visitPattern(node.test, location);
    return {
      node: {
        type: "UpdateExpression",
        prefix: node.prefix,
        operator: node.operator,
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  // Control //
  AwaitExpression: (node, location) => {
    const pair = visitExpression(node.argument, location);
    return {
      node: {
        type: "AwaitExpression",
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  YieldExpression: (node, location) => {
    const pair = visitExpression(node.argument, location);
    return {
      node: {
        type: "YieldExpression",
        delegate: node.delegate,
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  ConditionalExpression: (node, location) => {
    const pair1 = visitExpression(node.test, location);
    const pair2 = visitExpression(node.consequent, location);
    const pair3 = visitExpression(node.alternate, location);
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
  LogicalExpression: (node, location) => {
    const pair1 = visitExpression(node.left, location);
    const pair2 = visitExpression(node.right, location);
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
  SequenceExpression: (node, location) => {
    const pairs = node.expressions.map((child) => visitExpression(child, location))
    return {
      node: {
        type: "SequenceExpression",
        expressions: pairs.flatMap(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  },
  // Combination //
  MemberExpression: (node, location) => {
    const pair1 = visitExpression(node.object, location);
    let pair2;
    if (node.computed) {
      pair2 = visitExpression(node, location);
    } else {
      pair2 = visitMemberProperty(node, location);
    }
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
  ObjectExpression: getObjectExpressionVisitor(),
  ArrayExpression: (node, location) => {
    const pairs = node.elements.map((child) => {
      if (child === null) {
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
  BinaryExpression: (node, location) => {
    const pair1 = visitExpression(node.left, location);
    const pair2 = visitExpression(node.right, location);
    return {
      node: {
        type: "BinaryExpression",
        operator: node.operator,
        left: pair1.node,
        right: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  UnaryExpression: (node, location) => {
    const pair = visitExpression(node.argument, location);
    return {
      node: {
        type: "UnaryExpression",
        operator: node.operator,
        prefix: node.prefix, // always true
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  CallExpression: (node, location) => {
    const pair = visitExpression(node.callee, location);
    const pairs = node.arguments.map((child) => visitSpreadableExpression(child, location));
    return {
      node: {
        type: "CallExpression",
        callee: pair.node,
        arguments: pairs.map(getNode)
      },
      entities: [...pair.entities, ...pairs.flatMap(getEntities)]
    };
  },
  NewExpression: (node, location, context) => {
    const pair = visitExpression(node.callee, location);
    const pairs = node.arguments.map((child) => visitSpreadableExpression(child, location));
    return {
      node: {
        type: "NewExpression",
        callee: pair.node,
        arguments: pairs.map(getNode)
      },
      entities: [...pair.entities, ...pairs.flatMap(getEntities)]
    };
  }
};

const visitTemplateElement = makeVisit("TemplateElement", {
  __proto__: null,
  TemplateElement: (node, location) => ({
    node: {
      type: "TemplateElement",
      tail: node.tail,
      value: {
        cooked: node.value.cooked,
        raw: node.value.raw
      }
    },
    entities: []
  })
});

export const visitExpression = makeVisit("Expression", visitors);

export const getExpressionVisitorObject = () => visitors;

const visitSpreadableExpression = makeVisit("SpreadableExpression", {
  __proto__: visitors,
  SpreadElement: (node, location) => {
    const pair = visitExpression(node.argument, location);
    return {
      node: {
        type: "SpreadElement",
        argument: pair.node
      },
      entities: pair.entities
    };
  }
});

const visitMemberProperty = makeVisit("MemberProperty", {
  __proto__: null,
  Identifier: (node, location) => ({
    node: {
      type: "Identifier",
      name: node.name
    },
    entities: []
  })
});
