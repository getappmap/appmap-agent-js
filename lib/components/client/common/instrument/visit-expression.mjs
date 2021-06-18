import { setVisitor, visit, getEmptyResult, getEmptyArray } from './visit.mjs';

/////////////
// Literal //
/////////////

// ArrowFunctionExpression cf visit-common-closure.mjs

// FunctionExpression cf visit-common-closure.mjs

// ClassExpression cf visit-common-class.mjs

setVisitor('Literal', getEmptyArray, (node, location) => {
  if (Reflect.getOwnPropertyDescriptor(node, 'regex') !== undefined) {
    return {
      type: 'Literal',
      value: node.value,
      regex: {
        pattern: node.regex.pattern,
        flags: node.regex.flags,
      },
    };
  }
  if (Reflect.getOwnPropertyDescriptor(node, 'bigint') !== undefined) {
    return {
      type: 'Literal',
      value: node.value,
      bigint: node.bigint,
    };
  }
  return {
    type: 'Literal',
    value: node.value,
  };
});

setVisitor('TemplateElement', getEmptyArray, (node, location) => ({
  type: 'TemplateElement',
  tail: node.tail,
  value: {
    cooked: node.value.cooked,
    raw: node.value.raw,
  },
}));

setVisitor(
  'TemplateLiteral',
  (node, location) => [
    node.quasis.map((child) => visit(child, location)),
    node.expressions.map((child) => visit(child, location)),
  ],
  (node, location, children1, children2) => ({
    type: 'TemplateLiteral',
    quasis: children1,
    expressions: children2,
  }),
);

setVisitor(
  'TaggedTemplateExpression',
  (node, location) => [visit(node.tag, location), visit(node.quasi, location)],
  (node, location, child1, child2) => ({
    type: 'TaggedTemplateExpression',
    tag: child1,
    quasi: child2,
  }),
);

setVisitor(
  'SpreadElement',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'SpreadElement',
    argument: child,
  }),
);

setVisitor(
  'ArrayExpression',
  (node, location) => [
    node.elements.map((child) =>
      child == null ? getEmptyResult() : visit(child, location),
    ),
  ],
  (node, location, children) => ({
    type: 'ArrayExpression',
    elements: children,
  }),
);

setVisitor(
  'Property',
  (node, location) => [visit(node.key, location), visit(node.value, location)],
  (node, location, child1, child2) => ({
    type: 'Property',
    kind: node.kind,
    method: node.method,
    computed: node.computed,
    shorthand: false,
    key: child1,
    value: child2,
  }),
);

setVisitor(
  'ObjectExpression',
  (node, location) => [node.properties.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'ObjectExpression',
    properties: children,
  }),
);

/////////////////
// Environment //
/////////////////

// Identifier cf visit-common-other.mjs

setVisitor('Super', getEmptyArray, (node, location) => ({
  type: 'Super',
}));

setVisitor('ThisExpression', getEmptyArray, (node, location) => ({
  type: 'ThisExpression',
}));

setVisitor(
  'AssignmentExpression',
  (node, location) => [visit(node.left, location), visit(node.right, location)],
  (node, location, child1, child2) => ({
    type: 'AssignmentExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'UpdateExpression',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'UpdateExpression',
    prefix: node.prefix,
    operator: node.operator,
    argument: child,
  }),
);

/////////////
// Control //
/////////////

setVisitor(
  'ImportExpression',
  (node, location) => [visit(node.source, location)],
  (node, location, child) => ({
    type: 'ImportExpression',
    source: child,
  }),
);

setVisitor(
  'ChainExpression',
  (node, location) => [visit(node.expression, location)],
  (node, location, child) => ({
    type: 'ChainExpression',
    expression: child,
  }),
);

setVisitor(
  'AwaitExpression',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'AwaitExpression',
    argument: child,
  }),
);

setVisitor(
  'YieldExpression',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'YieldExpression',
    delegate: node.delegate,
    argument: child,
  }),
);

setVisitor(
  'ConditionalExpression',
  (node, location) => [
    visit(node.test, location),
    visit(node.consequent, location),
    visit(node.alternate, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'ConditionalExpression',
    test: child1,
    consequent: child2,
    alternate: child3,
  }),
);

setVisitor(
  'LogicalExpression',
  (node, location) => [visit(node.left, location), visit(node.right, location)],
  (node, location, child1, child2) => ({
    type: 'LogicalExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'SequenceExpression',
  (node, location) => [node.expressions.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'SequenceExpression',
    expressions: children,
  }),
);

//////////////////
// Comnbination //
//////////////////

setVisitor(
  'MemberExpression',
  (node, location) => [
    visit(node.object, location),
    visit(node.property, location),
  ],
  (node, location, child1, child2) => ({
    type: 'MemberExpression',
    computed: node.computed,
    optional: node.optional,
    object: child1,
    property: child2,
  }),
);

setVisitor(
  'BinaryExpression',
  (node, location) => [visit(node.left, location), visit(node.right, location)],
  (node, location, child1, child2) => ({
    type: 'BinaryExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'UnaryExpression',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'UnaryExpression',
    operator: node.operator,
    prefix: node.prefix, // always true
    argument: child,
  }),
);

setVisitor(
  'CallExpression',
  (node, location) => [
    visit(node.callee, location),
    node.arguments.map((child) => visit(child, location)),
  ],
  (node, location, child, children) => ({
    type: 'CallExpression',
    optional: node.optional,
    callee: child,
    arguments: children,
  }),
);

setVisitor(
  'NewExpression',
  (node, location) => [
    visit(node.callee, location),
    node.arguments.map((child) => visit(child, location)),
  ],
  (node, location, child, children) => ({
    type: 'NewExpression',
    callee: child,
    arguments: children,
  }),
);
