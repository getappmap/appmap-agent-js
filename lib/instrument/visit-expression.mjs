import { assignVisitorObject, visit } from './visit.mjs';
import { getEmptyResult, combineResult } from './result.mjs';

{
  const makeSuper = (node, location) => ({
    type: 'Super',
  });
  assignVisitorObject('SuperableExpression', {
    Super: (node, location) =>
      combineResult(makeSuper, node, location),
  });
}

{
  const makeTemplateElement = (node, location) => ({
    type: 'TemplateElement',
    tail: node.tail,
    value: {
      cooked: node.value.cooked,
      raw: node.value.raw,
    },
  });
  assignVisitorObject('TemplateElement', {
    TemplateElement: (node, location) =>
      combineResult(makeTemplateElement, node, location),
  });
}

{
  const makeTemplateLiteral = (node, location, childeren1, childeren2) => ({
    type: 'TemplateLiteral',
    quasis: childeren1,
    expressions: childeren2,
  });
  const visitor = (node, location) =>
    combineResult(
      makeTemplateLiteral,
      node,
      location,
      node.quasis.map((child) => visit('TemplateElement', child, location)),
      node.expressions.map((child) => visit('Expression', child, location)),
    );
  assignVisitorObject('TemplateLiteral', { TemplateLiteral: visitor });
  assignVisitorObject('Expression', { TemplateLiteral: visitor });
}

{
  const makeTaggedTemplateExpression = (node, location, child1, child2) => ({
    type: 'TaggedTemplateExpression',
    tag: child1,
    quasi: child2,
  });

  const makeThisExpression = (node, location) => ({
    type: 'ThisExpression',
  });

  const makeAssignmentExpression = (node, location, child1, child2) => ({
    type: 'AssignmentExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  });

  const makeUpdateExpression = (node, location, child) => ({
    type: 'UpdateExpression',
    prefix: node.prefix,
    operator: node.operator,
    argument: child,
  });

  const makeImportExpression = (node, location, child) => ({
    type: 'ImportExpression',
    source: child,
  });

  const makeChainExpression = (node, location, child) => ({
    type: 'ChainExpression',
    expression: child,
  });

  const makeAwaitExpression = (node, location, child) => ({
    type: 'AwaitExpression',
    argument: child,
  });

  const makeYieldExpression = (node, location, child) => ({
    type: 'YieldExpression',
    delegate: node.delegate,
    argument: child,
  });

  const makeConditionalExpression = (
    node,
    location,
    child1,
    child2,
    child3,
  ) => ({
    type: 'ConditionalExpression',
    test: child1,
    consequent: child2,
    alternate: child3,
  });

  const makeLogicalExpression = (node, location, child1, child2) => ({
    type: 'LogicalExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  });

  const makeSequenceExpression = (node, location, childeren) => ({
    type: 'SequenceExpression',
    expressions: childeren,
  });

  const makeMemberExpression = (node, location, child1, child2) => ({
    type: 'MemberExpression',
    computed: node.computed,
    optional: node.optional,
    object: child1,
    property: child2,
  });

  const makeArrayExpression = (node, location, childeren) => ({
    type: 'ArrayExpression',
    elements: childeren,
  });

  const makeBinaryExpression = (node, location, child1, child2) => ({
    type: 'BinaryExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  });

  const makeUnaryExpression = (node, location, child) => ({
    type: 'UnaryExpression',
    operator: node.operator,
    prefix: node.prefix, // always true
    argument: child,
  });

  const makeCallExpression = (node, location, child, childeren) => ({
    type: 'CallExpression',
    optional: node.optional,
    callee: child,
    arguments: childeren,
  });

  const makeNewExpression = (node, location, child, childeren) => ({
    type: 'NewExpression',
    callee: child,
    arguments: childeren,
  });

  const visitors = {
    // Literal //
    // Literal cf visit-common-other.mjs
    // TemplateLiteral cf here
    TaggedTemplateExpression: (node, location) =>
      combineResult(
        makeTaggedTemplateExpression,
        node,
        location,
        visit('Expression', node.tag, location),
        visit('TemplateLiteral', node.quasi, location),
      ),
    ArrayExpression: (node, location) =>
      combineResult(
        makeArrayExpression,
        node,
        location,
        node.elements.map((child) =>
          child == null
            ? getEmptyResult()
            : visit('SpreadableExpression', child, location),
        ),
      ),
    // ObjectExpression cf visit-common-object.mjs
    // ArrowFunctionExpression cf visit-common-closure.mjs
    // FunctionExpression cf visit-common-closure.mjs
    // ClassExpression cf visit-common-class.mjs
    // Environment //
    ThisExpression: (node, location) =>
      combineResult(makeThisExpression, node, location),
    // Identifier cf visit-common-other.mjs
    AssignmentExpression: (node, location) =>
      combineResult(
        makeAssignmentExpression,
        node,
        location,
        visit('Pattern', node.left, location),
        visit('Expression', node.right, location),
      ),
    UpdateExpression: (node, location) =>
      combineResult(
        makeUpdateExpression,
        node,
        location,
        visit('Pattern', node.argument, location),
      ),
    // Control //
    ImportExpression: (node, location) =>
      combineResult(
        makeImportExpression,
        node,
        location,
        visit('Expression', node.source, location),
      ),
    ChainExpression: (node, location) =>
      combineResult(
        makeChainExpression,
        node,
        location,
        visit('Expression', node.expression, location),
      ),
    AwaitExpression: (node, location) =>
      combineResult(
        makeAwaitExpression,
        node,
        location,
        visit('Expression', node.argument, location),
      ),
    YieldExpression: (node, location) =>
      combineResult(
        makeYieldExpression,
        node,
        location,
        visit('Expression', node.argument, location),
      ),
    ConditionalExpression: (node, location) =>
      combineResult(
        makeConditionalExpression,
        node,
        location,
        visit('Expression', node.test, location),
        visit('Expression', node.consequent, location),
        visit('Expression', node.alternate, location),
      ),
    LogicalExpression: (node, location) =>
      combineResult(
        makeLogicalExpression,
        node,
        location,
        visit('Expression', node.left, location),
        visit('Expression', node.right, location),
      ),
    SequenceExpression: (node, location) =>
      combineResult(
        makeSequenceExpression,
        node,
        location,
        node.expressions.map((child) => visit('Expression', child, location)),
      ),
    // Combination //
    MemberExpression: (node, location) =>
      combineResult(
        makeMemberExpression,
        node,
        location,
        visit('SuperableExpression', node.object, location),
        node.computed
          ? visit('Expression', node.property, location)
          : visit('NonScopingIdentifier', node.property, location),
      ),
    BinaryExpression: (node, location) =>
      combineResult(
        makeBinaryExpression,
        node,
        location,
        visit('Expression', node.left, location),
        visit('Expression', node.right, location),
      ),
    UnaryExpression: (node, location) =>
      combineResult(
        makeUnaryExpression,
        node,
        location,
        visit('Expression', node.argument, location),
      ),
    CallExpression: (node, location) =>
      combineResult(
        makeCallExpression,
        node,
        location,
        visit('SuperableExpression', node.callee, location),
        node.arguments.map((child) =>
          visit('SpreadableExpression', child, location),
        ),
      ),
    NewExpression: (node, location, context) =>
      combineResult(
        makeNewExpression,
        node,
        location,
        visit('Expression', node.callee, location),
        node.arguments.map((child) =>
          visit('SpreadableExpression', child, location),
        ),
      ),
  };

  assignVisitorObject('Expression', visitors);

  assignVisitorObject('Pattern', visitors);

  assignVisitorObject('SpreadableExpression', visitors);
  
  assignVisitorObject('SuperableExpression', visitors);
  
}
