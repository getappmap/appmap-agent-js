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

const joinReturnStatement = (node, { options: { session } }, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(`${session}_SUCCESS`),
    child === null ? buildRegularMemberExpression(session, 'undefined') : child,
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
  const makeSetupStatement = (node, { options: { session } }) =>
    buildVariableDeclaration('var', [
      buildVariableDeclarator(
        buildIdentifier(`${session}_TIMER`),
        buildCallExpression(
          buildRegularMemberExpression(session, 'getNow'),
          [],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${session}_EVENT_ID`),
        buildAssignmentExpression(
          '+=',
          buildRegularMemberExpression(session, 'event'),
          buildLiteral(1),
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${session}_SUCCESS`),
        buildRegularMemberExpression(session, 'empty'),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${session}_FAILURE`),
        buildRegularMemberExpression(session, 'empty'),
      ),
    ]);

  const makeEnterStatement = (
    node,
    { location, options: { origin, session } },
  ) =>
    buildExpressionStatement(
      buildCallExpression(buildRegularMemberExpression(session, 'record'), [
        buildLiteral(origin),
        buildObjectExpression([
          buildRegularProperty('id', buildIdentifier(`${session}_EVENT_ID`)),
          buildRegularProperty('event', buildLiteral('call')),
          buildRegularProperty(
            'thread_id',
            buildRegularMemberExpression(session, 'pid'),
          ),
          buildRegularProperty(
            'defined_class',
            buildLiteral(location.getName()),
          ),
          buildRegularProperty('method_id', buildLiteral('()')),
          buildRegularProperty(
            'path',
            buildLiteral(location.getFile().getRelativePath()),
          ),
          buildRegularProperty('lineno', buildLiteral(location.getStartLine())),
          buildRegularProperty(
            'receiver',
            buildCallExpression(
              buildRegularMemberExpression(session, 'serializeParameter'),
              [
                node.type === 'ArrowFunctionExpression'
                  ? buildRegularMemberExpression(session, 'empty')
                  : buildThisExpression(),
                buildLiteral('this'),
              ],
            ),
          ),
          buildRegularProperty(
            'parameters',
            buildArrayExpression(
              node.params.map((child, index) =>
                buildCallExpression(
                  buildRegularMemberExpression(session, 'serializeParameter'),
                  [
                    buildIdentifier(`${session}_ARGUMENT_${String(index)}`),
                    buildLiteral(
                      location
                        .getFile()
                        .getContent()
                        .substring(child.start, child.end),
                    ),
                  ],
                ),
              ),
            ),
          ),
          buildRegularProperty(
            'static',
            buildLiteral(location.isStaticMethod()),
          ),
        ]),
      ]),
    );

  const makeLeaveStatement = (node, { options: { session, origin } }) =>
    buildExpressionStatement(
      buildCallExpression(buildRegularMemberExpression(session, 'record'), [
        buildLiteral(origin),
        buildObjectExpression([
          buildRegularProperty(
            'id',
            buildAssignmentExpression(
              '+=',
              buildRegularMemberExpression(session, 'event'),
              buildLiteral(1),
            ),
          ),
          buildRegularProperty('event', buildLiteral('return')),
          buildRegularProperty(
            'thread_id',
            buildRegularMemberExpression(session, 'pid'),
          ),
          buildRegularProperty(
            'parent_id',
            buildIdentifier(`${session}_EVENT_ID`),
          ),
          buildRegularProperty(
            'ellapsed',
            buildBinaryExpression(
              '-',
              buildCallExpression(
                buildRegularMemberExpression(session, 'getNow'),
                [],
              ),
              buildIdentifier(`${session}_TIMER`),
            ),
          ),
          buildRegularProperty(
            'return_value',
            buildCallExpression(
              buildRegularMemberExpression(session, 'serializeParameter'),
              [buildIdentifier(`${session}_SUCCESS`), buildLiteral('return')],
            ),
          ),
          buildRegularProperty(
            'exceptions',
            buildCallExpression(
              buildRegularMemberExpression(session, 'serializeException'),
              [buildIdentifier(`${session}_FAILURE`)],
            ),
          ),
        ]),
      ]),
    );

  const makeFailureStatement = (node, { options: { session } }) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(`${session}_FAILURE`),
        buildIdentifier(`${session}_ERROR`),
      ),
    );

  const makeHeadStatementArray = (node, { options: { session } }, children) =>
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
                      buildIdentifier(`${session}_ARGUMENT_${String(index)}`),
                      buildRegularMemberExpression(session, 'undefined'),
                    ),
                    child.right,
                    buildIdentifier(`${session}_ARGUMENT_${String(index)}`),
                  ),
                );
              }
              return buildVariableDeclarator(
                child,
                buildIdentifier(`${session}_ARGUMENT_${String(index)}`),
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
        `${context.options.session}_ARGUMENT_${String(index)}`,
      );
      if (child.type === 'RestElement') {
        pattern = buildRestElement(pattern);
      }
      return pattern;
    }),
    body: buildBlockStatement([
      makeSetupStatement(node, context),
      makeEnterStatement(node, context),
      buildTryStatement(
        buildBlockStatement([
          ...makeHeadStatementArray(node, context, children),
          ...makeBodyStatementArray(node, context, child2),
        ]),
        buildCatchClause(
          buildIdentifier(`${context.options.session}_ERROR`),
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

  setVisitor('ArrowFunctionExpression', splitClosure, joinClosure);

  setVisitor('FunctionExpression', splitClosure, joinClosure);

  setVisitor('FunctionDeclaration', splitClosure, joinClosure);
}
