import { setVisitor, visit, getEmptyResult } from './visit.mjs';

/////////////
// Builder //
/////////////

const buildBlockStatement = (nodes) => ({
  type: 'BlockStatement',
  body: nodes,
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
  type: "MemberExpression",
  optional: false,
  computed: false,
  object: buildIdentifier(name1),
  property: buildIdentifier(name2)
});

/////////////////////
// ReturnStatement //
/////////////////////

const joinReturnStatement = (node, {options:{prefix}}, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(`${prefix}_SUCCESS`),
    child === null
      ? buildRegularMemberExpression(prefix, "undefined")
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
  const makeSetupStatement = (node, {options:{prefix}}) =>
    buildVariableDeclaration('var', [
      buildVariableDeclarator(
        buildIdentifier(`${prefix}_TIMER`),
        buildCallExpression(
          buildRegularMemberExpression(prefix, "getNow"),
          [],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${prefix}_EVENT_ID`),
        buildAssignmentExpression(
          '+=',
          buildRegularMemberExpression(prefix, "counter"),
          buildLiteral(1),
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${prefix}_SUCCESS`),
        buildRegularMemberExpression(prefix, "empty")
      ),
      buildVariableDeclarator(
        buildIdentifier(`${prefix}_FAILURE`),
        buildRegularMemberExpression(prefix, "empty"),
      ),
    ]);

  const makeEnterStatement = (node, {location, options:{prefix}}) =>
    buildExpressionStatement(
      buildCallExpression(
        buildRegularMemberExpression(prefix, "record"),
        [
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildIdentifier(`${prefix}_EVENT_ID`),
            ),
            buildRegularProperty('event', buildLiteral('call')),
            buildRegularProperty(
              'thread_id',
              buildRegularMemberExpression(prefix, "pid"),
            ),
            buildRegularProperty(
              'defined_class',
              buildLiteral(
                location.getParentContainerName(),
              ),
            ),
            buildRegularProperty(
              'method_id',
              buildLiteral(location.getName()),
            ),
            buildRegularProperty('path', buildLiteral(location.getFile().getPath())),
            buildRegularProperty(
              'lineno',
              buildLiteral(location.getStartLine()),
            ),
            buildRegularProperty(
              'receiver',
              buildCallExpression(
                buildRegularMemberExpression(prefix, "serializeParameter"),
                [
                  node.type === 'ArrowFunctionExpression'
                    ? buildRegularMemberExpression(prefix, "empty")
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
                    buildRegularMemberExpression(prefix, "serializeParameter"),
                    [
                      buildIdentifier(`${prefix}_ARGUMENT_${String(index)}`),
                      buildLiteral(
                        location.getFile()
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
        ],
      ),
    );

  const makeLeaveStatement = (node, {options:{prefix}}) =>
    buildExpressionStatement(
      buildCallExpression(
        buildRegularMemberExpression(prefix, "record"),
        [
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildAssignmentExpression(
                '+=',
                buildRegularMemberExpression(prefix, "counter"),
                buildLiteral(1),
              ),
            ),
            buildRegularProperty('event', buildLiteral('return')),
            buildRegularProperty(
              'thread_id',
              buildRegularMemberExpression(prefix, "pid"),
            ),
            buildRegularProperty(
              'parent_id',
              buildIdentifier(`${prefix}_EVENT_ID`),
            ),
            buildRegularProperty(
              'ellapsed',
              buildBinaryExpression(
                '-',
                buildCallExpression(
                  buildRegularMemberExpression(prefix, "getNow"),
                  [],
                ),
                buildIdentifier(`${prefix}_TIMER`),
              ),
            ),
            buildRegularProperty(
              'return_value',
              buildCallExpression(
                buildRegularMemberExpression(prefix, "serializeParameter"),
                [
                  buildIdentifier(`${prefix}_SUCCESS`),
                  buildLiteral('return'),
                ],
              ),
            ),
            buildRegularProperty(
              'exceptions',
              buildCallExpression(
                buildRegularMemberExpression(prefix, "serializeException"),
                [buildIdentifier(`${prefix}_FAILURE`)],
              ),
            ),
          ]),
        ],
      ),
    );

  const makeFailureStatement = (node, {options:{prefix}}) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(`${prefix}_FAILURE`),
        buildIdentifier(`${prefix}_ERROR`),
      ),
    );

  const makeHeadStatementArray = (node, {options:{prefix}}, childeren) =>
    childeren.length === 0
      ? []
      : [
          buildVariableDeclaration(
            'var',
            childeren.map((child, index) =>
              buildVariableDeclarator(
                child,
                buildIdentifier(`${prefix}_ARGUMENT_${String(index)}`),
              ),
            ),
          ),
        ];

  const makeBodyStatementArray = (node, context, child) =>
    child.type === 'BlockStatement'
      ? child.body
      : [joinReturnStatement(node, context, child)];

  const joinClosure = (node, context, child1, childeren, child2) => ({
    type: node.type,
    id: child1,
    expression: false,
    async: node.async,
    generator: node.generator,
    params: node.params.map((child, index) => {
      let pattern = buildIdentifier(
        `${context.options.prefix}_ARGUMENT_${String(index)}`,
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
          ...makeHeadStatementArray(node, context, childeren),
          ...makeBodyStatementArray(node, context, child2),
        ]),
        buildCatchClause(
          buildIdentifier(`${context.options.prefix}_ERROR`),
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
