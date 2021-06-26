import { setVisitor, visit, getEmptyResult } from './visit.mjs';

/////////////
// Builder //
/////////////

const buildBlockStatement = (nodes) => ({
  type: 'BlockStatement',
  body: nodes,
});

const buildConditionalExpression = (node1, node2, node3) => ({
  type: 'ConditionalExpression',
  test: node1,
  consequent: node2,
  alternate: node3,
});

const buildCatchClause = (node1, node2) => ({
  type: 'CatchClause',
  param: node1,
  body: node2,
});

const buildTryStatement = (node1, node2, node3) => ({
  type: 'TryStatement',
  block: node1,
  handler: node2,
  finalizer: node3,
});

const buildRestElement = (node) => ({
  type: 'RestElement',
  argument: node,
});

const buildBinaryExpression = (operator, node1, node2) => ({
  type: 'BinaryExpression',
  operator,
  left: node1,
  right: node2,
});

const buildAssignmentExpression = (operator, node1, node2) => ({
  type: 'AssignmentExpression',
  operator,
  left: node1,
  right: node2,
});

const buildObjectExpression = (nodes) => ({
  type: 'ObjectExpression',
  properties: nodes,
});

const buildArrayExpression = (nodes) => ({
  type: 'ArrayExpression',
  elements: nodes,
});

const buildThisExpression = () => ({
  type: 'ThisExpression',
});

const buildIdentifier = (name) => ({
  type: 'Identifier',
  name,
});

const buildLiteral = (name) => ({
  type: 'Literal',
  value: name,
});

const buildRegularProperty = (name, node) => ({
  type: 'Property',
  kind: 'init',
  computed: false,
  shorthand: false,
  method: false,
  key: {
    type: 'Identifier',
    name,
  },
  value: node,
});

const buildVariableDeclaration = (kind, nodes) => ({
  type: 'VariableDeclaration',
  kind,
  declarations: nodes,
});

const buildThrowStatement = (node) => ({
  type: 'ThrowStatement',
  argument: node,
});

const buildVariableDeclarator = (node1, node2) => ({
  type: 'VariableDeclarator',
  id: node1,
  init: node2,
});

const buildCallExpression = (node, nodes) => ({
  type: 'CallExpression',
  optional: false,
  callee: node,
  arguments: nodes,
});

const buildExpressionStatement = (node) => ({
  type: 'ExpressionStatement',
  expression: node,
});

const buildRegularMemberExpression = (name1, name2) => ({
  type: 'MemberExpression',
  optional: false,
  computed: false,
  object: buildIdentifier(name1),
  property: buildIdentifier(name2),
});

/////////////////////
// ReturnStatement //
/////////////////////

const joinReturnStatement = (node, context, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(`${context.getSession()}_SUCCESS`),
    child === null
      ? buildRegularMemberExpression(context.getSession(), 'undefined')
      : child,
  ),
});

setVisitor(
  'ReturnStatement',
  (node, context) => [
    node.argument === null ? getEmptyResult() : visit(node.argument, context),
  ],
  joinReturnStatement,
);

/////////////
// Closure //
/////////////

{
  const makeSetupStatement = (node, context) =>
    buildVariableDeclaration('var', [
      buildVariableDeclarator(
        buildIdentifier(`${context.getSession()}_RECORD_RETURN`),
        buildCall(
          buildLiteral(
            getNodeIndex(node)
          ),
          buildRegularMemberExpression(
            context.getSession(),
            "recordApply"
          ),
          buildArrayExpression(
            node.params.map((child, index) => buildIdentifier(
              `${context.getSession()}_ARGUMENT_${String(index)}`,
            )),
          )
        )
      ),
      buildVariableDeclarator(
        buildIdentifier(`${context.getSession()}_SUCCESS`),
        buildRegularMemberExpression(context.getSession(), 'empty'),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${context.getSession()}_FAILURE`),
        buildRegularMemberExpression(context.getSession(), 'empty'),
      ),
    ]);

  const makeLeaveStatement = (node, context) =>
    buildExpressionStatement(
      buildCallExpression(
        buildIdentifier(`${context.getSession()}_RECORD_RETURN`),
        [
          buildIdentifier(`${context.getSession()}_SUCCESS`),
          buildIdentifier(`${context.getSession()}_FAILURE`)
        ]
      )
    )

  const makeFailureStatement = (node, context) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(`${context.getSession()}_FAILURE`),
        buildIdentifier(`${context.getSession()}_ERROR`),
      ),
    );

  const makeHeadStatementArray = (node, context, children) =>
    children.length === 0
      ? []
      : [
          buildVariableDeclaration(
            'var',
            children.map((child, index) => {
              // Special case for AssignmentPattern:
              //
              // function f (x = {}) {}
              //
              // function f (APPMAP_ARGUMENT_0) {
              //   // does not work :(
              //   var x = {} = APPMAP_ARGUMENT_0;
              // }
              if (child.type === 'AssignmentPattern') {
                return buildVariableDeclarator(
                  child.left,
                  buildConditionalExpression(
                    buildBinaryExpression(
                      '===',
                      buildIdentifier(
                        `${context.getSession()}_ARGUMENT_${String(index)}`,
                      ),
                      buildRegularMemberExpression(
                        context.getSession(),
                        'undefined',
                      ),
                    ),
                    child.right,
                    buildIdentifier(
                      `${context.getSession()}_ARGUMENT_${String(index)}`,
                    ),
                  ),
                );
              }
              return buildVariableDeclarator(
                child,
                buildIdentifier(
                  `${context.getSession()}_ARGUMENT_${String(index)}`,
                ),
              );
            }),
          ),
        ];

  const makeBodyStatementArray = (node, context, child) =>
    child.type === 'BlockStatement'
      ? child.body
      : [joinReturnStatement(node, context, child)];

  const joinClosure = (node, context, child1, children, child2) => ({
    type: node.type,
    id: child1,
    expression: false,
    async: node.async,
    generator: node.generator,
    params: node.params.map((child, index) => {
      let pattern = buildIdentifier(
        `${context.getSession()}_ARGUMENT_${String(index)}`,
      );
      if (child.type === 'RestElement') {
        pattern = buildRestElement(pattern);
      }
      return pattern;
    }),
    body: buildBlockStatement([
      makeEnterStatement(node, context),
      buildTryStatement(
        buildBlockStatement([
          ...makeHeadStatementArray(node, context, children),
          ...makeBodyStatementArray(node, context, child2),
        ]),
        buildCatchClause(
          buildIdentifier(`${context.getSession()}_ERROR`),
          buildBlockStatement([makeFailureStatement(node, context)]),
        ),
        buildBlockStatement([makeLeaveStatement(node, context)]),
      ),
    ]),
  });

  const splitClosure = (node, context) => [
    node.type === 'ArrowFunctionExpression' || node.id === null
      ? getEmptyResult()
      : visit(node.id, context),
    node.params.map((child) =>
      visit(child.type === 'RestElement' ? child.argument : child, context),
    ),
    visit(node.body, context),
  ];

  const wrapClosure = (node, context, entities) => [
    makeFunctionEntity(
      node,
      (
        node.type !== "ArrowFunctionExpression" &&
        getNodeParent(node).type === "MethodDefinition" &&
        getNodeParent(node).static
      ),
      entities
    )
  ];

  setVisitor(
    'ArrowFunctionExpression',
    (node, context) => computeCaption(node),
    splitClosure,
    wrapClosure,
    joinClosure,
  );

  setVisitor(
    'FunctionExpression',
    (node, context) => (
      node.id === null ?
      computeCaption(node) :
      makeCaption("FunctionExpression", node.id.name)
    ),
    splitClosure,
    wrapClosure,
    joinClosure,
  );

  setVisitor(
    'FunctionDeclaration',
    (node, context) => makeCaption(
      "FunctionDeclaration",
      node.id === null ? "default" : node.id.name,
    ),
    splitClosure,
    wrapClosure,
    joinClosure,
  );

}
