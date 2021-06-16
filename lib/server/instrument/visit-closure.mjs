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

const joinReturnStatement = (node, location, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(`${location.getSession()}_SUCCESS`),
    child === null
      ? buildRegularMemberExpression(location.getSession(), 'undefined')
      : child,
  ),
});

setVisitor(
  'ReturnStatement',
  (node, location) => [
    node.argument === null ? getEmptyResult() : visit(node.argument, location),
  ],
  joinReturnStatement,
);

/////////////
// Closure //
/////////////

{
  const makeSetupStatement = (node, location) =>
    buildVariableDeclaration('var', [
      buildVariableDeclarator(
        buildIdentifier(`${location.getSession()}_TIMER`),
        buildCallExpression(
          buildRegularMemberExpression(location.getSession(), 'getNow'),
          [],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${location.getSession()}_EVENT_ID`),
        buildAssignmentExpression(
          '+=',
          buildRegularMemberExpression(location.getSession(), 'event_counter'),
          buildLiteral(1),
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${location.getSession()}_SUCCESS`),
        buildRegularMemberExpression(location.getSession(), 'empty'),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${location.getSession()}_FAILURE`),
        buildRegularMemberExpression(location.getSession(), 'empty'),
      ),
    ]);

  const makeEnterStatement = (node, location) => {
    const designator = location.getClosureDesignator();
    return buildExpressionStatement(
      buildCallExpression(
        buildRegularMemberExpression(location.getSession(), 'record'),
        [
          buildLiteral(location.getOrigin()),
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildIdentifier(`${location.getSession()}_EVENT_ID`),
            ),
            buildRegularProperty('event', buildLiteral('call')),
            buildRegularProperty(
              'thread_id',
              buildRegularMemberExpression(location.getSession(), 'thread_id'),
            ),
            buildRegularProperty(
              'defined_class',
              buildLiteral(designator.defined_class),
            ),
            buildRegularProperty(
              'method_id',
              buildLiteral(designator.method_id),
            ),
            buildRegularProperty('path', buildLiteral(designator.path)),
            buildRegularProperty('lineno', buildLiteral(designator.lineno)),
            buildRegularProperty(
              'receiver',
              buildCallExpression(
                buildRegularMemberExpression(
                  location.getSession(),
                  'serializeParameter',
                ),
                [
                  node.type === 'ArrowFunctionExpression'
                    ? buildRegularMemberExpression(
                        location.getSession(),
                        'empty',
                      )
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
                    buildRegularMemberExpression(
                      location.getSession(),
                      'serializeParameter',
                    ),
                    [
                      buildIdentifier(
                        `${location.getSession()}_ARGUMENT_${String(index)}`,
                      ),
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
            buildRegularProperty('static', buildLiteral(designator.static)),
          ]),
        ],
      ),
    );
  };

  const makeLeaveStatement = (node, location) =>
    buildExpressionStatement(
      buildCallExpression(
        buildRegularMemberExpression(location.getSession(), 'record'),
        [
          buildLiteral(location.getOrigin()),
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildAssignmentExpression(
                '+=',
                buildRegularMemberExpression(
                  location.getSession(),
                  'event_counter',
                ),
                buildLiteral(1),
              ),
            ),
            buildRegularProperty('event', buildLiteral('return')),
            buildRegularProperty(
              'thread_id',
              buildRegularMemberExpression(location.getSession(), 'thread_id'),
            ),
            buildRegularProperty(
              'parent_id',
              buildIdentifier(`${location.getSession()}_EVENT_ID`),
            ),
            buildRegularProperty(
              'ellapsed',
              buildBinaryExpression(
                '-',
                buildCallExpression(
                  buildRegularMemberExpression(location.getSession(), 'getNow'),
                  [],
                ),
                buildIdentifier(`${location.getSession()}_TIMER`),
              ),
            ),
            buildRegularProperty(
              'return_value',
              buildCallExpression(
                buildRegularMemberExpression(
                  location.getSession(),
                  'serializeParameter',
                ),
                [
                  buildIdentifier(`${location.getSession()}_SUCCESS`),
                  buildLiteral('return'),
                ],
              ),
            ),
            buildRegularProperty(
              'exceptions',
              buildCallExpression(
                buildRegularMemberExpression(
                  location.getSession(),
                  'serializeException',
                ),
                [buildIdentifier(`${location.getSession()}_FAILURE`)],
              ),
            ),
          ]),
        ],
      ),
    );

  const makeFailureStatement = (node, location) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(`${location.getSession()}_FAILURE`),
        buildIdentifier(`${location.getSession()}_ERROR`),
      ),
    );

  const makeHeadStatementArray = (node, location, children) =>
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
                        `${location.getSession()}_ARGUMENT_${String(index)}`,
                      ),
                      buildRegularMemberExpression(
                        location.getSession(),
                        'undefined',
                      ),
                    ),
                    child.right,
                    buildIdentifier(
                      `${location.getSession()}_ARGUMENT_${String(index)}`,
                    ),
                  ),
                );
              }
              return buildVariableDeclarator(
                child,
                buildIdentifier(
                  `${location.getSession()}_ARGUMENT_${String(index)}`,
                ),
              );
            }),
          ),
        ];

  const makeBodyStatementArray = (node, location, child) =>
    child.type === 'BlockStatement'
      ? child.body
      : [joinReturnStatement(node, location, child)];

  const joinClosure = (node, location, child1, children, child2) => ({
    type: node.type,
    id: child1,
    expression: false,
    async: node.async,
    generator: node.generator,
    params: node.params.map((child, index) => {
      let pattern = buildIdentifier(
        `${location.getSession()}_ARGUMENT_${String(index)}`,
      );
      if (child.type === 'RestElement') {
        pattern = buildRestElement(pattern);
      }
      return pattern;
    }),
    body: buildBlockStatement([
      makeSetupStatement(node, location),
      makeEnterStatement(node, location),
      buildTryStatement(
        buildBlockStatement([
          ...makeHeadStatementArray(node, location, children),
          ...makeBodyStatementArray(node, location, child2),
        ]),
        buildCatchClause(
          buildIdentifier(`${location.getSession()}_ERROR`),
          buildBlockStatement([makeFailureStatement(node, location)]),
        ),
        buildBlockStatement([makeLeaveStatement(node, location)]),
      ),
    ]),
  });

  const splitClosure = (node, location) => [
    node.type === 'ArrowFunctionExpression' || node.id === null
      ? getEmptyResult()
      : visit(node.id, location),
    node.params.map((child) =>
      visit(child.type === 'RestElement' ? child.argument : child, location),
    ),
    visit(node.body, location),
  ];

  setVisitor('ArrowFunctionExpression', splitClosure, joinClosure);

  setVisitor('FunctionExpression', splitClosure, joinClosure);

  setVisitor('FunctionDeclaration', splitClosure, joinClosure);
}
