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

/////////////////////
// ReturnStatement //
/////////////////////

const joinReturnStatement = (node, context, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(context.namespace.getLocal('SUCCESS')),
    child === null
      ? buildIdentifier(context.namespace.getGlobal('UNDEFINED'))
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
        buildIdentifier(context.namespace.getLocal('TIMER')),
        buildCallExpression(
          buildIdentifier(context.namespace.getGlobal('GET_NOW')),
          [],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(context.namespace.getLocal('EVENT_ID')),
        buildAssignmentExpression(
          '+=',
          buildIdentifier(context.namespace.getGlobal('EVENT_COUNTER')),
          buildLiteral(1),
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(context.namespace.getLocal('SUCCESS')),
        buildIdentifier(context.namespace.getGlobal('EMPTY_MARKER')),
      ),
      buildVariableDeclarator(
        buildIdentifier(context.namespace.getLocal('FAILURE')),
        buildIdentifier(context.namespace.getGlobal('EMPTY_MARKER')),
      ),
    ]);

  const makeEnterStatement = (node, context) =>
    buildExpressionStatement(
      buildCallExpression(
        buildIdentifier(context.namespace.getGlobal('EMIT')),
        [
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildIdentifier(context.namespace.getLocal('EVENT_ID')),
            ),
            buildRegularProperty('event', buildLiteral('call')),
            buildRegularProperty(
              'thread_id',
              buildIdentifier(context.namespace.getGlobal('PROCESS_ID')),
            ),
            buildRegularProperty(
              'defined_class',
              buildLiteral(
                context.location.getParentContainerName(context.file),
              ),
            ),
            buildRegularProperty(
              'method_id',
              buildLiteral(context.location.getName(context.file)),
            ),
            buildRegularProperty('path', buildLiteral(context.file.getPath())),
            buildRegularProperty(
              'lineno',
              buildLiteral(context.location.getStartLine()),
            ),
            buildRegularProperty(
              'receiver',
              buildCallExpression(
                buildIdentifier(
                  context.namespace.getGlobal('SERIALIZE_PARAMETER'),
                ),
                [
                  node.type === 'ArrowFunctionExpression'
                    ? buildIdentifier(
                        context.namespace.getGlobal('EMPTY_MARKER'),
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
                    buildIdentifier(
                      context.namespace.getGlobal('SERIALIZE_PARAMETER'),
                    ),
                    [
                      buildIdentifier(
                        `${context.namespace.getLocal('ARGUMENT')}_${String(
                          index,
                        )}`,
                      ),
                      buildLiteral(
                        context.file
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
              buildLiteral(context.location.isStaticMethod()),
            ),
          ]),
        ],
      ),
    );

  const makeLeaveStatement = (node, context) =>
    buildExpressionStatement(
      buildCallExpression(
        buildIdentifier(context.namespace.getGlobal('EMIT')),
        [
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildAssignmentExpression(
                '+=',
                buildIdentifier(context.namespace.getGlobal('EVENT_COUNTER')),
                buildLiteral(1),
              ),
            ),
            buildRegularProperty('event', buildLiteral('return')),
            buildRegularProperty(
              'thread_id',
              buildIdentifier(context.namespace.getGlobal('PROCESS_ID')),
            ),
            buildRegularProperty(
              'parent_id',
              buildIdentifier(context.namespace.getLocal('EVENT_ID')),
            ),
            buildRegularProperty(
              'ellapsed',
              buildBinaryExpression(
                '-',
                buildCallExpression(
                  buildIdentifier(context.namespace.getGlobal('GET_NOW')),
                  [],
                ),
                buildIdentifier(context.namespace.getLocal('TIMER')),
              ),
            ),
            buildRegularProperty(
              'return_value',
              buildCallExpression(
                buildIdentifier(
                  context.namespace.getGlobal('SERIALIZE_PARAMETER'),
                ),
                [
                  buildIdentifier(context.namespace.getLocal('SUCCESS')),
                  buildLiteral('return'),
                ],
              ),
            ),
            buildRegularProperty(
              'exceptions',
              buildCallExpression(
                buildIdentifier(
                  context.namespace.getGlobal('SERIALIZE_EXCEPTION'),
                ),
                [buildIdentifier(context.namespace.getLocal('FAILURE'))],
              ),
            ),
          ]),
        ],
      ),
    );

  const makeFailureStatement = (node, context) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(context.namespace.getLocal('FAILURE')),
        buildIdentifier(context.namespace.getLocal('ERROR')),
      ),
    );

  const makeHeadStatementArray = (node, context, childeren) =>
    childeren.length === 0
      ? []
      : [
          buildVariableDeclaration(
            'var',
            childeren.map((child, index) =>
              buildVariableDeclarator(
                child,
                buildIdentifier(
                  `${context.namespace.getLocal('ARGUMENT')}_${String(index)}`,
                ),
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
        `${context.namespace.getLocal('ARGUMENT')}_${String(index)}`,
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
          buildIdentifier(context.namespace.getLocal('ERROR')),
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
