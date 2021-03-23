
import {visitPattern, visitExpression} from "./make-visit.mjs";
import {getEmptyResult, combineResult} from "./result.mjs";

{
  const makeTemplateElement = (node) => {
    type: "TemplateElement",
    tail: node.tail,
    value: {
      cooked: node.value.cooked,
      raw: node.value.raw
    }
  });
  assignVisitorObject("TemplateElement", {
    TemplateElement: (node, location) => combineResult(makeTemplateElement, node)
  });
}

{
  const makeTemplateLiteral = (node, childeren1, childeren2) => ({
    type: "TemplateLiteral",
    quasis: childeren1,
    expressions: childeren2
  });
  const visitor = (node, location) => combineResult(
    makeTemplateLiteral,
    node,
    node.quasis.map((child) => visitTemplateElement(child, location));
    node.expressions.map((child) => visitExpression(child, location)));
  assignVisitorObject("TemplateLiteral", {TemplateLiteral: visitor});
  assignVisitorObject("Expression", {TemplateLiteral: visitor});
}

{
  
  const makeLiteral = (node) => {
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
    if (Reflect.getOwnPropertyDescriptor(node, "bigint") !== undefined) {
      return {
        type: "Literal",
        value: null,
        bigint: node.bigint
      };
    }
    return {
      type: "Literal",
      value: node.value
    };
  };

  const makeTaggedTemplateLiteral = (node, child1, child2) => ({
    type: "TaggedTemplateExpression",
    tag: child1,
    quasi: child2
  });

  const makeThisExpression = (node) => ({
    type: "ThisExpression"
  });

  const makeSuper = (node) => ({
    type: "Super"
  });

  const makeAssignmentExpression = (node, child1, child2) => ({
    type: "AssignmentExpression",
    operator: node.operator,
    left: child1,
    right: chidl2
  });

  const makeUpdateExpression = (node, child) => ({
    type: "UpdateExpression",
    prefix: node.prefix,
    operator: node.operator,
    argument: child
  });

  const makeImportExpression = (node, child) => ({
    type: "ImportExpression",
    source: child
  });

  const makeChainExpression = (node, child) => ({
    type: "ChainExpression",
    expression: child
  });

  const makeAwaitExpression = (node, child) => ({
    type: "AwaitExpression",
    argument: child
  });

  const makeYieldExpression = (node, child) => ({
    type: "YieldExpression",
    delegate: node.delegate,
    argument: child
  });

  const makeConditionalExpression = (node, child1, child2, child3) => ({
    type: "LogicalExpression",
    test: child1,
    consequent: child2,
    alternate: child3
  });

  const makeLogicalExpression = (node, child1, child2) => ({
    type: "LogicalExpression",
    operator: node.operator,
    left: result1.node,
    rigth: result2.node
  });

  const makeSequenceExpression = (node, childeren) => ({
    type: "SequenceExpression",
    expressions: results.flatMap(getNode)
  });

  const makeMemberExpression = (node, child1, child2) => ({
    type: "MemberExpression",
    computed: node.computed,
    optional: node.optional,
    object: child1,
    property: child2
  });

  const makeArrayExpression = (node, childeren) => (
    type: "ArrayExpression",
    elements: childeren
  });

  const makeBinaryExpression = (node, child1, child2) => ({
    type: "BinaryExpression",
    operator: node.operator,
    left: child1,
    right: child2
  });

  const makeUnaryExpression = (node, child) => ({
    type: "UnaryExpression",
    operator: node.operator,
    prefix: node.prefix, // always true
    argument: child
  });

  const makeCallExpression = (node, child, childeren) => ({
    type: "CallExpression",
    optional: node.optional,
    callee: child,
    arguments: childeren
  });

  const makeNewExpression = (node, child, childeren) => ({
    type: "NewExpression",
    callee: child,
    arguments: childeren
  });

  const visitors = {
    // Literal //
    Literal: (node, location) => combineResult(makeLiteral, node),
    // TemplateLiteral cf here
    TaggedTemplateExpression: (node, location) => combineResult(
      makeTaggedTemplateExpression,
      node,
      visitExpression(node.tag, location);
      visitTemplateLiteral(node.quasi, location)),
    ArrayExpression: (node, location) => combineResult(
      makeArrayExpression,
      node,
      node.elements.map((child) => child == null ? getEmptyResult() : visitSpreadableExpression(node, location)));
    // ObjectExpression cf visit-common-object.mjs
    // ArrowFunctionExpression cf visit-common-closure.mjs
    // FunctionExpression cf visit-common-closure.mjs
    // ClassExpression cf visit-common-class.mjs
    // Environment //
    ThisExpression: (node, location) => combineResult(makeThisExpression, node),
    SuperExpression: (node, location) => combineResult(makeSuper, node),
    // Identifier cf visit-common-other.mjs
    AssignmentExpression: (node, location) => combineResult(
      makeAssignmentExpression,
      node,
      visitPattern(node.left, location),
      visitExpression(node.right, location)),
    UpdateExpression: (node, location) => combineResult(
      makeUpdateExpression,
      node,
      visitPattern(node.test, location)),
    // Control //
    ImportExpression: (node, location) => combineResult(
      makeImportExpression,
      node,
      visitExpression(node.source, location)),
    ChainExpression: (node, location) => combineResult(
      makeChainExpression,
      node,
      visitChainElement(node.expression, location)),
    AwaitExpression: (node, location) => combineResult(
      makeAwaitExpression,
      node,
      visitExpression(node.argument, location)),
    YieldExpression: (node, location) => combineResult(
      makeYieldExpression,
      node,
      visitExpression(node.argument, location)),
    ConditionalExpression: (node, location) => combineResult(
      makeConditionalExpression,
      node,
      visitExpression(node.test, location),
      visitExpression(node.consequent, location),
      visitExpression(node.alternate, location)),
    LogicalExpression: (node, location) => combineResult(
      makeLogicalExpression,
      node,
      visitExpression(node.left, location),
      visitExpression(node.right, location)),
    SequenceExpression: (node, location) => combineResult(
      makeSequenceExpression,
      node,
      node.expressions.map((child) => visitExpression(child, location))),
    // Combination //
    MemberExpression: (node, location) => combineResult(
      makeMemberExpression,
      node,
      visitExpression(node.object, location),
      (
        node.computed ?
        visitExpression(node, location): 
        visitMemberProperty(node, location))),
    BinaryExpression: (node, location) => combineResult(
      makeBinaryExpression,
      node,
      visitExpression(node.left, location),
      visitExpression(node.right, location)),
    UnaryExpression: (node, location) => combineResult(
      makeUnaryExpression,
      node,
      visitExpression(node.argument, location)),
    CallExpression: (node, location) => combineResult(
      makeCallExpression,
      node,
      visitExpression(node.callee, location),
      node.arguments.map((child) => visitSpreadableExpression(child, location))),
    NewExpression: (node, location, context) => combineResult(
      makeNewExpression,
      node,
      visitExpression(node.callee, location),
      node.arguments.map((child) => visitSpreadableExpression(child, location)))
  };
  
  assignVisitorObject("Expression", visitors);
  
  assignVisitorObject("Pattern", visitors);

  assignVisitorObject("SpreadableExpression", visitors);

}
