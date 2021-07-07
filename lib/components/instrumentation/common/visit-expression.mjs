import { constant, identity } from "../../../util/index.mjs";
import { setSimpleVisitor, visit, getEmptyVisitResult } from "./visit.mjs";

const getEmptyArray = constant([]);

////////////
// Atomic //
////////////

/////////////
// Literal //
/////////////

// ArrowFunctionExpression cf visit-common-closure.mjs

// FunctionExpression cf visit-common-closure.mjs

// ClassExpression cf visit-common-class.mjs

setSimpleVisitor("Literal", getEmptyArray, identity);

setSimpleVisitor("TemplateElement", getEmptyArray, identity);

setSimpleVisitor(
  "TemplateLiteral",
  (node, context) => [
    node.quasis.map((child) => visit(child, context, node)),
    node.expressions.map((child) => visit(child, context, node)),
  ],
  (node, context, children1, children2) => ({
    type: "TemplateLiteral",
    quasis: children1,
    expressions: children2,
  }),
);

setSimpleVisitor(
  "TaggedTemplateExpression",
  (node, context) => [
    visit(node.tag, context, node),
    visit(node.quasi, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "TaggedTemplateExpression",
    tag: child1,
    quasi: child2,
  }),
);

setSimpleVisitor(
  "SpreadElement",
  (node, context) => [visit(node.argument, context, node)],
  (node, context, child) => ({
    type: "SpreadElement",
    argument: child,
  }),
);

setSimpleVisitor(
  "ArrayExpression",
  (node, context) => [
    node.elements.map((child) =>
      child == null ? getEmptyVisitResult() : visit(child, context, node),
    ),
  ],
  (node, context, children) => ({
    type: "ArrayExpression",
    elements: children,
  }),
);

setSimpleVisitor(
  "Property",
  (node, context) => [
    visit(node.key, context, node),
    visit(node.value, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "Property",
    kind: node.kind,
    method: node.method,
    computed: node.computed,
    shorthand: false,
    key: child1,
    value: child2,
  }),
);

setSimpleVisitor(
  "ObjectExpression",
  (node, context) => [
    node.properties.map((child) => visit(child, context, node)),
  ],
  (node, context, children) => ({
    type: "ObjectExpression",
    properties: children,
  }),
);

/////////////////
// Environment //
/////////////////

// Identifier cf visit-common-other.mjs

setSimpleVisitor("Super", getEmptyArray, identity);

setSimpleVisitor("ThisExpression", getEmptyArray, identity);

setSimpleVisitor(
  "AssignmentExpression",
  (node, context) => [
    visit(node.left, context, node),
    visit(node.right, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "AssignmentExpression",
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setSimpleVisitor(
  "UpdateExpression",
  (node, context) => [visit(node.argument, context, node)],
  (node, context, child) => ({
    type: "UpdateExpression",
    prefix: node.prefix,
    operator: node.operator,
    argument: child,
  }),
);

/////////////
// Control //
/////////////

setSimpleVisitor(
  "ImportExpression",
  (node, context) => [visit(node.source, context, node)],
  (node, context, child) => ({
    type: "ImportExpression",
    source: child,
  }),
);

setSimpleVisitor(
  "ChainExpression",
  (node, context) => [visit(node.expression, context, node)],
  (node, context, child) => ({
    type: "ChainExpression",
    expression: child,
  }),
);

setSimpleVisitor(
  "AwaitExpression",
  (node, context) => [visit(node.argument, context, node)],
  (node, context, child) => ({
    type: "AwaitExpression",
    argument: child,
  }),
);

setSimpleVisitor(
  "YieldExpression",
  (node, context) => [visit(node.argument, context, node)],
  (node, context, child) => ({
    type: "YieldExpression",
    delegate: node.delegate,
    argument: child,
  }),
);

setSimpleVisitor(
  "ConditionalExpression",
  (node, context) => [
    visit(node.test, context, node),
    visit(node.consequent, context, node),
    visit(node.alternate, context, node),
  ],
  (node, context, child1, child2, child3) => ({
    type: "ConditionalExpression",
    test: child1,
    consequent: child2,
    alternate: child3,
  }),
);

setSimpleVisitor(
  "LogicalExpression",
  (node, context) => [
    visit(node.left, context, node),
    visit(node.right, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "LogicalExpression",
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setSimpleVisitor(
  "SequenceExpression",
  (node, context) => [
    node.expressions.map((child) => visit(child, context, node)),
  ],
  (node, context, children) => ({
    type: "SequenceExpression",
    expressions: children,
  }),
);

//////////////////
// Comnbination //
//////////////////

setSimpleVisitor(
  "MemberExpression",
  (node, context) => [
    visit(node.object, context, node),
    visit(node.property, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "MemberExpression",
    computed: node.computed,
    optional: node.optional,
    object: child1,
    property: child2,
  }),
);

setSimpleVisitor(
  "BinaryExpression",
  (node, context) => [
    visit(node.left, context, node),
    visit(node.right, context, node),
  ],
  (node, context, child1, child2) => ({
    type: "BinaryExpression",
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setSimpleVisitor(
  "UnaryExpression",
  (node, context) => [visit(node.argument, context, node)],
  (node, context, child) => ({
    type: "UnaryExpression",
    operator: node.operator,
    prefix: node.prefix, // always true
    argument: child,
  }),
);

setSimpleVisitor(
  "CallExpression",
  (node, context) => [
    visit(node.callee, context, node),
    node.arguments.map((child) => visit(child, context, node)),
  ],
  (node, context, child, children) => ({
    type: "CallExpression",
    optional: node.optional,
    callee: child,
    arguments: children,
  }),
);

setSimpleVisitor(
  "NewExpression",
  (node, context) => [
    visit(node.callee, context, node),
    node.arguments.map((child) => visit(child, context, node)),
  ],
  (node, context, child, children) => ({
    type: "NewExpression",
    callee: child,
    arguments: children,
  }),
);
