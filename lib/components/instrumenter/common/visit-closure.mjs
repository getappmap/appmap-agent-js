import { getNodeIndex, getNodeParent } from "./node.mjs";
import { makeCaption, computeCaption } from "./caption.mjs";
import { makeFunctionEntity } from "./entity.mjs";
import {
  setSimpleVisitor,
  setVisitor,
  visit,
  getEmptyVisitResult,
} from "./visit.mjs";

/////////////
// Builder //
/////////////

const buildBlockStatement = (nodes) => ({
  type: "BlockStatement",
  body: nodes,
});

const buildConditionalExpression = (node1, node2, node3) => ({
  type: "ConditionalExpression",
  test: node1,
  consequent: node2,
  alternate: node3,
});

const buildCatchClause = (node1, node2) => ({
  type: "CatchClause",
  param: node1,
  body: node2,
});

const buildTryStatement = (node1, node2, node3) => ({
  type: "TryStatement",
  block: node1,
  handler: node2,
  finalizer: node3,
});

const buildRestElement = (node) => ({
  type: "RestElement",
  argument: node,
});

const buildBinaryExpression = (operator, node1, node2) => ({
  type: "BinaryExpression",
  operator,
  left: node1,
  right: node2,
});

const buildAssignmentExpression = (operator, node1, node2) => ({
  type: "AssignmentExpression",
  operator,
  left: node1,
  right: node2,
});

// const buildObjectExpression = (nodes) => ({
//   type: 'ObjectExpression',
//   properties: nodes,
// });

const buildArrayExpression = (nodes) => ({
  type: "ArrayExpression",
  elements: nodes,
});

const buildThisExpression = () => ({
  type: "ThisExpression",
});

const buildIdentifier = (name) => ({
  type: "Identifier",
  name,
});

const buildLiteral = (name) => ({
  type: "Literal",
  value: name,
});

// const buildRegularProperty = (name, node) => ({
//   type: 'Property',
//   kind: 'init',
//   computed: false,
//   shorthand: false,
//   method: false,
//   key: {
//     type: 'Identifier',
//     name,
//   },
//   value: node,
// });

const buildVariableDeclaration = (kind, nodes) => ({
  type: "VariableDeclaration",
  kind,
  declarations: nodes,
});

const buildThrowStatement = (node) => ({
  type: "ThrowStatement",
  argument: node,
});

const buildVariableDeclarator = (node1, node2) => ({
  type: "VariableDeclarator",
  id: node1,
  init: node2,
});

const buildCallExpression = (node, nodes) => ({
  type: "CallExpression",
  optional: false,
  callee: node,
  arguments: nodes,
});

const buildExpressionStatement = (node) => ({
  type: "ExpressionStatement",
  expression: node,
});

const buildRegularMemberExpression = (name1, name2) => ({
  type: "MemberExpression",
  optional: false,
  computed: false,
  object: buildIdentifier(name1),
  property: buildIdentifier(name2),
});

/////////////////////
// ReturnStatement //
/////////////////////

const joinReturnStatement = (node, context, child) => ({
  type: "ReturnStatement",
  argument: buildAssignmentExpression(
    "=",
    buildIdentifier(`${context.runtime}_SUCCESS`),
    child === null
      ? buildRegularMemberExpression(context.runtime, "undefined")
      : child,
  ),
});

setSimpleVisitor(
  "ReturnStatement",
  (node, context) => [
    node.argument === null
      ? getEmptyVisitResult()
      : visit(node.argument, context, node),
  ],
  joinReturnStatement,
);

/////////////
// Closure //
/////////////

const joinClosure = (node, context, child1, children, child2) => ({
  type: node.type,
  id: child1,
  expression: false,
  async: node.async,
  generator: node.generator,
  params: node.params.map((child, index) => {
    let pattern = buildIdentifier(
      `${context.runtime}_ARGUMENT_${String(index)}`,
    );
    if (child.type === "RestElement") {
      pattern = buildRestElement(pattern);
    }
    return pattern;
  }),
  body: buildBlockStatement([
    buildVariableDeclaration("var", [
      buildVariableDeclarator(
        buildIdentifier(`${context.runtime}_RECORD_RETURN`),
        buildCallExpression(
          buildRegularMemberExpression(context.runtime, "recordApply"),
          [
            buildLiteral(getNodeIndex(node)),
            buildThisExpression(),
            buildArrayExpression(
              node.params.map((child, index) =>
                buildIdentifier(`${context.runtime}_ARGUMENT_${String(index)}`),
              ),
            ),
          ],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${context.runtime}_FAILURE`),
        buildRegularMemberExpression(context.runtime, "empty"),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${context.runtime}_SUCCESS`),
        buildRegularMemberExpression(context.runtime, "empty"),
      ),
    ]),
    buildTryStatement(
      buildBlockStatement([
        ...(children.length === 0
          ? []
          : [
              buildVariableDeclaration(
                "var",
                children.map((child, index) => {
                  // Special case for AssignmentPattern:
                  //
                  // function f (x = {}) {}
                  //
                  // function f (APPMAP_ARGUMENT_0) {
                  //   // does not work :(
                  //   var x = {} = APPMAP_ARGUMENT_0;
                  // }
                  if (child.type === "AssignmentPattern") {
                    return buildVariableDeclarator(
                      child.left,
                      buildConditionalExpression(
                        buildBinaryExpression(
                          "===",
                          buildIdentifier(
                            `${context.runtime}_ARGUMENT_${String(index)}`,
                          ),
                          buildRegularMemberExpression(
                            context.runtime,
                            "undefined",
                          ),
                        ),
                        child.right,
                        buildIdentifier(
                          `${context.runtime}_ARGUMENT_${String(index)}`,
                        ),
                      ),
                    );
                  }
                  return buildVariableDeclarator(
                    child,
                    buildIdentifier(
                      `${context.runtime}_ARGUMENT_${String(index)}`,
                    ),
                  );
                }),
              ),
            ]),
        ...(child2.type === "BlockStatement"
          ? child2.body
          : [joinReturnStatement(node, context, child2)]),
      ]),
      buildCatchClause(
        buildIdentifier(`${context.runtime}_ERROR`),
        buildBlockStatement([
          buildThrowStatement(
            buildAssignmentExpression(
              "=",
              buildIdentifier(`${context.runtime}_FAILURE`),
              buildIdentifier(`${context.runtime}_ERROR`),
            ),
          ),
        ]),
      ),
      buildBlockStatement([
        buildExpressionStatement(
          buildCallExpression(
            buildIdentifier(`${context.runtime}_RECORD_RETURN`),
            [
              buildIdentifier(`${context.runtime}_FAILURE`),
              buildIdentifier(`${context.runtime}_SUCCESS`),
            ],
          ),
        ),
      ]),
    ),
  ]),
});

const splitClosure = (node, context) => [
  node.type === "ArrowFunctionExpression" || node.id === null
    ? getEmptyVisitResult()
    : visit(node.id, context, node),
  node.params.map((child) =>
    visit(child.type === "RestElement" ? child.argument : child, context, node),
  ),
  visit(node.body, context, node),
];

const wrapClosure = (node, context, entities) => [
  makeFunctionEntity(
    node,
    node.type !== "ArrowFunctionExpression" &&
      getNodeParent(node).type === "MethodDefinition" &&
      getNodeParent(node).static,
    entities,
  ),
];

setVisitor(
  "ArrowFunctionExpression",
  (node, context) => computeCaption(node),
  splitClosure,
  wrapClosure,
  joinClosure,
);

setVisitor(
  "FunctionExpression",
  (node, context) =>
    node.id === null
      ? computeCaption(node)
      : makeCaption("FunctionExpression", node.id.name),
  splitClosure,
  wrapClosure,
  joinClosure,
);

setVisitor(
  "FunctionDeclaration",
  (node, context) =>
    makeCaption(
      "FunctionDeclaration",
      node.id === null ? "default" : node.id.name,
    ),
  splitClosure,
  wrapClosure,
  joinClosure,
);
