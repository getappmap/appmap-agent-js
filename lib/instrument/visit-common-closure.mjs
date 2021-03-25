import { assignVisitorObject, visit } from './visit.mjs';
import { getEmptyResult, combineResult, encapsulateResult } from './result.mjs';

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

////////////////////
// BlockStatement //
////////////////////

{
  const makeBlockStatement = (node, location, childeren) => ({
    type: 'BlockStatement',
    body: childeren,
  });
  const visitor = (node, location) =>
    combineResult(
      makeBlockStatement,
      node,
      location,
      node.body.map((child) => visit("Statement", child, location)),
    );
  assignVisitorObject('BlockStatement', { BlockStatement: visitor });
  assignVisitorObject('Statement', { BlockStatement: visitor });
}

/////////////////////
// ReturnStatement //
/////////////////////

const makeReturnStatement = (node, location, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(location.getNamespace().getLocal('SUCCESS')),
    child === null
      ? buildIdentifier(location.getNamespace().getGlobal('UNDEFINED'))
      : child,
  ),
});

assignVisitorObject('Statement', {
  ReturnStatement: (node, location) =>
    combineResult(
      makeReturnStatement,
      node,
      location,
      node.argument === null
        ? getEmptyResult()
        : visit('Expression', node.argument, location),
    ),
});

/////////////
// Closure //
/////////////

{
  const makeSetupStatement = (node, location, namespace) =>
    buildVariableDeclaration('var', [
      buildVariableDeclarator(
        buildIdentifier(namespace.getLocal('TIMER')),
        buildCallExpression(
          buildIdentifier(namespace.getGlobal('GET_NOW')),
          [],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(namespace.getLocal('EVENT_IDENTITY')),
        buildAssignmentExpression(
          '+=',
          buildIdentifier(namespace.getGlobal('EVENT_COUNTER')),
          buildLiteral(1),
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(namespace.getLocal('SUCCESS')),
        buildIdentifier(namespace.getGlobal('EMPTY_MARKER')),
      ),
      buildVariableDeclarator(
        buildIdentifier(namespace.getLocal('FAILURE')),
        buildIdentifier(namespace.getGlobal('EMPTY_MARKER')),
      ),
    ]);

  const makeEnterStatement = (node, location, namespace) =>
    buildExpressionStatement(
      buildCallExpression(buildIdentifier(namespace.getGlobal('ADD_EVENT')), [
        buildObjectExpression([
          buildRegularProperty(
            'id',
            buildIdentifier(namespace.getLocal('EVENT_IDENTITY')),
          ),
          buildRegularProperty('event', buildLiteral('call')),
          buildRegularProperty(
            'thread_id',
            buildIdentifier(namespace.getGlobal('PROCESS_ID')),
          ),
          buildRegularProperty(
            'defined_class',
            buildLiteral(location.parent.getContainerName()),
          ),
          buildRegularProperty('method_id', buildLiteral(location.getName())),
          buildRegularProperty(
            'path',
            buildLiteral(location.getFile().getPath()),
          ),
          buildRegularProperty('lineno', buildLiteral(location.getStartLine())),
          buildRegularProperty(
            'receiver',
            buildCallExpression(
              buildIdentifier(namespace.getGlobal('SERIALIZE_PARAMETER')),
              [
                node.type === 'ArrowFunctionExpression'
                  ? buildIdentifier(namespace.getGlobal('EMPTY_MARKER'))
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
                  buildIdentifier(namespace.getGlobal('SERIALIZE_PARAMETER')),
                  [
                    buildIdentifier(
                      `${namespace.getLocal('ARGUMENT')}_${String(index)}`,
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
          buildRegularProperty(
            'static',
            buildLiteral(location.isStaticMethod()),
          ),
        ]),
      ]),
    );

  const makeLeaveStatement = (node, location, namespace) =>
    buildExpressionStatement(
      buildCallExpression(buildIdentifier(namespace.getGlobal('ADD_EVENT')), [
        buildObjectExpression([
          buildRegularProperty(
            'id',
            buildAssignmentExpression(
              '+=',
              buildIdentifier(namespace.getGlobal('EVENT_COUNTER')),
              buildLiteral(1),
            ),
          ),
          buildRegularProperty('event', buildLiteral('return')),
          buildRegularProperty(
            'thread_id',
            buildIdentifier(namespace.getGlobal('PROCESS_ID')),
          ),
          buildRegularProperty(
            'parent_id',
            buildIdentifier(namespace.getGlobal('EVENT_IDENTITY')),
          ),
          buildRegularProperty(
            'ellapsed',
            buildBinaryExpression(
              '-',
              buildCallExpression(
                buildIdentifier(namespace.getGlobal('GET_NOW')),
                [],
              ),
              buildIdentifier(namespace.getLocal('TIMER')),
            ),
          ),
          buildRegularProperty(
            'return_value',
            buildCallExpression(
              buildIdentifier(namespace.getGlobal('SERIALIZE_PARAMETER')),
              [
                buildIdentifier(namespace.getLocal('SUCCESS')),
                buildLiteral('return'),
              ],
            ),
          ),
          buildRegularProperty(
            'exceptions',
            buildCallExpression(
              buildIdentifier(namespace.getGlobal('SERIALIZE_EXCEPTION')),
              [buildIdentifier(namespace.getLocal('FAILURE'))],
            ),
          ),
        ]),
      ]),
    );

  const makeFailureStatement = (node, location, namespace) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(namespace.getLocal('FAILURE')),
        buildIdentifier(namespace.getLocal('ERROR')),
      ),
    );

  const makeHeadStatement = (node, location, namespace, childeren) =>
    buildVariableDeclaration(
      'var',
      childeren.map((child, index) =>
        buildVariableDeclarator(
          child,
          buildIdentifier(`${namespace.getLocal('ARGUMENT')}_${String(index)}`),
        ),
      ),
    );

  const makeBodyStatementArray = (node, location, namespace, child) =>
    child.type === 'BlockStatement'
      ? child.body
      : [makeReturnStatement(node, location, child)];

  const makeClosure = (node, location, child1, childeren, child2) => {
    const namespace = location.getNamespace();
    return {
      type: node.type,
      id: child1,
      expression: false,
      async: node.async,
      generator: node.generator,
      params: node.params.map((child, index) => {
        let pattern = buildIdentifier(
          `${namespace.getLocal('ARGUMENT')}_${String(index)}`,
        );
        if (child.type === 'RestElement') {
          pattern = buildRestElement(pattern);
        }
        return pattern;
      }),
      body: buildBlockStatement([
        makeSetupStatement(node, location, namespace),
        makeEnterStatement(node, location, namespace),
        buildTryStatement(
          buildBlockStatement([
            makeHeadStatement(node, location, namespace, childeren),
            ...makeBodyStatementArray(node, location, namespace, child2),
          ]),
          buildCatchClause(
            buildIdentifier(namespace.getLocal('ERROR')),
            buildBlockStatement([
              makeFailureStatement(node, location, namespace),
            ]),
          ),
          buildBlockStatement([makeLeaveStatement(node, location, namespace)]),
        ),
      ]),
    };
  };

  const makeVisitor = (kind) => (node, location) =>
    encapsulateResult(
      combineResult(
        makeClosure,
        node,
        location,
        node.type === 'ArrowFunctionExpression' || node.id === null
          ? getEmptyResult()
          : visit(kind, node.id, location),
        node.params.map((child) => visit(
          "Pattern",
          child.type === "RestElement" ? child.argument : child,
          location)),
        visit(
          node.type === 'ArrowFunctionExpression' && node.expression
            ? 'Expression'
            : 'BlockStatement',
          node.body,
          location,
        ),
      ),
      location,
    );

  assignVisitorObject('Expression', {
    FunctionExpression: makeVisitor('NonScopingIdentifier'),
    ArrowFunctionExpression: makeVisitor(null),
  });

  assignVisitorObject('Statement', {
    FunctionDeclaration: makeVisitor('ScopingIdentifier'),
  });

  assignVisitorObject('Method', {
    FunctionExpression: makeVisitor(null),
  });
}
