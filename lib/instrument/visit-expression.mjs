import {
  assignVisitorObject,
  visitNonScopingIdentifier,
  visitTemplateElement,
  visitTemplateLiteral,
  visitSpreadableExpression,
  visitPattern,
  visitExpression,
} from './visit.mjs';
import { getEmptyResult, combineResult } from './result.mjs';

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
      node.quasis.map((child) => visitTemplateElement(child, location)),
      node.expressions.map((child) => visitExpression(child, location)),
    );
  assignVisitorObject('TemplateLiteral', { TemplateLiteral: visitor });
  assignVisitorObject('Expression', { TemplateLiteral: visitor });
}

{
  const makeLiteral = (node, location) => {
    if (Reflect.getOwnPropertyDescriptor(node, 'regex') !== undefined) {
      return {
        type: 'Literal',
        value: null,
        regex: {
          pattern: node.regex.pattern,
          flags: node.regex.flags,
        },
      };
    }
    if (Reflect.getOwnPropertyDescriptor(node, 'bigint') !== undefined) {
      return {
        type: 'Literal',
        value: null,
        bigint: node.bigint,
      };
    }
    return {
      type: 'Literal',
      value: node.value,
    };
  };

  const makeTaggedTemplateExpression = (node, location, child1, child2) => ({
    type: 'TaggedTemplateExpression',
    tag: child1,
    quasi: child2,
  });

  const makeThisExpression = (node, location) => ({
    type: 'ThisExpression',
  });

  const makeSuper = (node, location) => ({
    type: 'Super',
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
    type: 'LogicalExpression',
    test: child1,
    consequent: child2,
    alternate: child3,
  });

  const makeLogicalExpression = (node, location, child1, child2) => ({
    type: 'LogicalExpression',
    operator: node.operator,
    left: child1,
    rigth: child2,
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
    Literal: (node, location) => combineResult(makeLiteral, node, location),
    // TemplateLiteral cf here
    TaggedTemplateExpression: (node, location) =>
      combineResult(
        makeTaggedTemplateExpression,
        node,
        location,
        visitExpression(node.tag, location),
        visitTemplateLiteral(node.quasi, location),
      ),
    ArrayExpression: (node, location) =>
      combineResult(
        makeArrayExpression,
        node,
        location,
        node.elements.map((child) =>
          child == null
            ? getEmptyResult()
            : visitSpreadableExpression(node, location),
        ),
      ),
    // ObjectExpression cf visit-common-object.mjs
    // ArrowFunctionExpression cf visit-common-closure.mjs
    // FunctionExpression cf visit-common-closure.mjs
    // ClassExpression cf visit-common-class.mjs
    // Environment //
    ThisExpression: (node, location) =>
      combineResult(makeThisExpression, node, location),
    SuperExpression: (node, location) =>
      combineResult(makeSuper, node, location),
    // Identifier cf visit-common-other.mjs
    AssignmentExpression: (node, location) =>
      combineResult(
        makeAssignmentExpression,
        node,
        location,
        visitPattern(node.left, location),
        visitExpression(node.right, location),
      ),
    UpdateExpression: (node, location) =>
      combineResult(
        makeUpdateExpression,
        node,
        location,
        visitPattern(node.test, location),
      ),
    // Control //
    ImportExpression: (node, location) =>
      combineResult(
        makeImportExpression,
        node,
        location,
        visitExpression(node.source, location),
      ),
    ChainExpression: (node, location) =>
      combineResult(
        makeChainExpression,
        node,
        location,
        visitExpression(node.expression, location),
      ),
    AwaitExpression: (node, location) =>
      combineResult(
        makeAwaitExpression,
        node,
        location,
        visitExpression(node.argument, location),
      ),
    YieldExpression: (node, location) =>
      combineResult(
        makeYieldExpression,
        node,
        location,
        visitExpression(node.argument, location),
      ),
    ConditionalExpression: (node, location) =>
      combineResult(
        makeConditionalExpression,
        node,
        location,
        visitExpression(node.test, location),
        visitExpression(node.consequent, location),
        visitExpression(node.alternate, location),
      ),
    LogicalExpression: (node, location) =>
      combineResult(
        makeLogicalExpression,
        node,
        location,
        visitExpression(node.left, location),
        visitExpression(node.right, location),
      ),
    SequenceExpression: (node, location) =>
      combineResult(
        makeSequenceExpression,
        node,
        location,
        node.expressions.map((child) => visitExpression(child, location)),
      ),
    // Combination //
    MemberExpression: (node, location) =>
      combineResult(
        makeMemberExpression,
        node,
        location,
        visitExpression(node.object, location),
        node.computed
          ? visitExpression(node, location)
          : visitNonScopingIdentifier(node, location),
      ),
    BinaryExpression: (node, location) =>
      combineResult(
        makeBinaryExpression,
        node,
        location,
        visitExpression(node.left, location),
        visitExpression(node.right, location),
      ),
    UnaryExpression: (node, location) =>
      combineResult(
        makeUnaryExpression,
        node,
        location,
        visitExpression(node.argument, location),
      ),
    CallExpression: (node, location) =>
      combineResult(
        makeCallExpression,
        node,
        location,
        visitExpression(node.callee, location),
        node.arguments.map((child) =>
          visitSpreadableExpression(child, location),
        ),
      ),
    NewExpression: (node, location, context) =>
      combineResult(
        makeNewExpression,
        node,
        location,
        visitExpression(node.callee, location),
        node.arguments.map((child) =>
          visitSpreadableExpression(child, location),
        ),
      ),
  };

  assignVisitorObject('Expression', visitors);

  assignVisitorObject('Pattern', visitors);

  assignVisitorObject('SpreadableExpression', visitors);
}
