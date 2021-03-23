import {
  assignVisitorObject,
  visitExpression,
  visitNonScopingIdentifier,
  visitScopingIdentifier,
  visitBlockStatement,
  visitPattern,
  visitRestablePattern,
} from './visit.mjs';
import { getEmptyResult, combineResult, encapsulateResult } from './result.mjs';

/////////////
// Builder //
/////////////

const makeRegularProperty = (name, node) => ({
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

const makeRegularVariableDeclarator = (name, node) => ({
  type: 'VariableDeclaratior',
  id: {
    type: 'Identifier',
    name,
  },
  init: node,
});

/////////////
// Success //
/////////////

const makeReturnStatement = (node, location, child) => ({
  type: 'ReturnStatement',
  argument: {
    type: 'AssignmentExpression',
    operator: '=',
    left: {
      type: 'Identifier',
      name: location.getNamespace().getLocal('SUCCESS'),
    },
    right:
      child === null
        ? {
            type: 'UnaryExpression',
            operator: 'void',
            prefix: true,
            argument: {
              type: 'Literal',
              value: 0,
            },
          }
        : child,
  },
});

assignVisitorObject('Statement', {
  ReturnStatement: (node, location) =>
    combineResult(
      makeReturnStatement,
      node,
      location,
      node.argument === null
        ? getEmptyResult()
        : visitExpression(node.argument, location),
    ),
});

// let
//   APPMAP_LOCAL_TIMER = APPMAP_GLOBAL_GET_NOW();
//   APPMAP_LOCAL_EVENT_IDENTITY = ++APPMAP_GLOBAL_EVENT_COUNTER,
//   APPMAP_LOCAL_SUCCESS = APPMAP_GLOBAL_EMPTY_MARKER,
//   APPMAP_LOCAL_FAILURE = APPMAP_GLOBAL_EMPTY_MARKER;
const makeSetupStatement = (node, location) => ({
  type: 'VariableDeclaration',
  kind: location.getFile().getLanguageVersion() < 2015 ? 'var' : 'let',
  declarations: [
    makeRegularVariableDeclarator(location.getNamespace().getLocal('TIMER'), {
      type: 'CallExpression',
      optional: false,
      callee: {
        type: 'Identifier',
        name: location.getNamespace().getGlobal('GET_NOW'),
      },
      arguments: [],
    }),
    makeRegularVariableDeclarator(
      location.getNamespace().getLocal('EVENT_IDENTITY'),
      {
        type: 'UpdateExpression',
        prefix: true,
        operator: '++',
        argument: {
          type: 'Identifier',
          name: location.getNamespace().getGlobal('EVENT_COUNTER'),
        },
      },
    ),
    makeRegularVariableDeclarator(location.getNamespace().getLocal('SUCCESS'), {
      type: 'Identifier',
      name: location.getNamespace().getGlobal('EMPTY_MARKER'),
    }),
    makeRegularVariableDeclarator(location.getNamespace().getLocal('FAILURE'), {
      type: 'Identifier',
      name: location.getNamespace().getGlobal('EMPTY_MARKER'),
    }),
  ],
});

// APPMAP_GLOBAL_ADD_EVENT({
//   id: APPMAP_LOCAL_EVENT_IDENTITY,
//   type: "call",
//   thread_ID: APPMAP_GLOBAL_PROCESS_ID,
//   defined_class: "TODO",
//   method_id: "TODO",
//   path: ...,
//   lineno: ...,
//   receiver: APPMAP_GLOBAL_SERIALIZE_PARAMETER(this | APPMAP_GLOBAL_EMPTY_MARKER, "this"),
//   parameters: APPMAP_GLOBAL_SERIALIZE_ARGUMENT_ARRAY(APPMAP_LOCAL_ARGUMENTS, [...])
//   static: "TODO"
// })
const makeEnterStatement = (node, location) => ({
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: location.getNamespace().getGlobal('ADD_EVENT'),
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          makeRegularProperty('id', {
            type: 'identifier',
            name: location.getNamespace().getLocal('EVENT_IDENTITY'),
          }),
          makeRegularProperty('event', {
            type: 'Literal',
            value: 'call',
          }),
          makeRegularProperty('thread_id', {
            type: 'Identifier',
            name: location.getNamespace().getGlobal('PROCESS_ID'),
          }),
          makeRegularProperty('defined_class', {
            type: 'Literal',
            value: 'TODO',
          }),
          makeRegularProperty('method_id', {
            type: 'Literal',
            value: 'TODO',
          }),
          makeRegularProperty('path', {
            type: 'Literal',
            value: location.getNamespace().getFile().getPath(),
          }),
          makeRegularProperty('lineno', {
            type: 'Literal',
            value: location.getNamespace().getStartLine(),
          }),
          makeRegularProperty('receiver', {
            type: 'CallExpression',
            optional: false,
            callee: {
              type: 'Identifier',
              name: location.getNamespace().getGlobal('SERIALIZE_PARAMETER'),
            },
            arguments: [
              node.type === 'ArrowFunctionExpression'
                ? {
                    type: 'Identifier',
                    name: location.getNamespace().getGlobal('EMPTY_MARKER'),
                  }
                : {
                    type: 'ThisExpression',
                  },
              {
                type: 'Literal',
                name: 'this',
              },
            ],
          }),
          makeRegularProperty('parameters', {
            type: 'ArrayExpression',
            elements: node.params.map((child, index) => ({
              type: 'CallExpression',
              optional: false,
              callee: {
                type: 'Identifier',
                name: location.getNamespace().getGlobal('SERIALIZE_PARAMETER'),
              },
              arguments: [
                {
                  type: 'Identifier',
                  name:
                    location.getNamespace().getLocal('ARGUMENT') +
                    String(index),
                },
                {
                  type: 'Literal',
                  name: location
                    .getFile()
                    .getContent()
                    .substring(child.start, child.end),
                },
              ],
            })),
          }),
          makeRegularProperty('static', {
            type: 'Literal',
            value: 'TODO',
          }),
        ],
      },
    ],
  },
});

const makeLeaveStatement = (node, location) => ({
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    optional: false,
    callee: {
      type: 'Identifier',
      name: location.getNamespace().getGlobal('ADD_EVENT'),
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          makeRegularProperty('id', {
            type: 'UpdateExpression',
            prefix: true,
            operator: '++',
            argument: {
              type: 'Identifier',
              name: location.getNamespace().getGlobal('EVENT_COUNTER'),
            },
          }),
          makeRegularProperty('event', {
            type: 'Literal',
            value: 'return',
          }),
          makeRegularProperty('thread_id', {
            type: 'name',
            value: location.getNamespace().getGlobal('PROCESS_ID'),
          }),
          makeRegularProperty('parent_id', {
            type: 'name',
            value: location.getNamespace().getGlobal('EVENT_IDENTITY'),
          }),
          makeRegularProperty('ellapsed', {
            type: 'BinaryExpression',
            operator: '-',
            left: {
              type: 'CallExpression',
              optional: false,
              callee: {
                type: 'Identifier',
                name: location.getNamespace().getGlobal('GET_NOW'),
              },
              arguments: [],
            },
            right: {
              type: 'Identifier',
              name: location.getNamespace().getLocal('TIMER'),
            },
          }),
        ],
      },
    ],
  },
});

const makeFailureStatement = (node, location) => ({
  type: 'ThrowStatement',
  argument: {
    type: 'AssignmentExpression',
    operator: '=',
    left: location.getNamespace().getLocal('FAILURE'),
    right: location.getNamespace().getLocal('ERROR'),
  },
});

const makeHeadStatementArray = (node, location, childeren) => ({
  type: 'VariableDeclaration',
  kind: 'var',
  declarations: childeren.map((child, index) => ({
    type: 'VariableDeclarator',
    id: child,
    init: {
      type: 'Identifier',
      name: location.getNamespace().getLocal('ARGUMENT') + String(index),
    },
  })),
});

const makeBodyStatementArray = (node, location, child) =>
  child.type === 'BlockStatement'
    ? child.body
    : [makeReturnStatement(node, location, child)];

const makeClosure = (node, location, child1, childeren, child2) => ({
  type: node.type,
  id: child1,
  async: node.async,
  generator: node.generator,
  params: node.params.map((child, index) => {
    let pattern = {
      type: 'Identifier',
      name: location.getNamespace().getLocal('ARGUMENT') + String(index),
    };
    if (child.type === 'RestElement') {
      pattern = {
        type: 'RestElement',
        argument: pattern,
      };
    }
    return pattern;
  }),
  body: {
    type: 'BlockStatement',
    body: [
      makeSetupStatement(node, location),
      makeEnterStatement(node, location),
      {
        type: 'TryStatement',
        block: {
          type: 'BlockStatement',
          body: [
            ...makeHeadStatementArray(node, location, childeren),
            ...makeBodyStatementArray(node, location, child2),
          ],
        },
        handler: {
          type: 'CatchClause',
          param: {
            type: 'Identifier',
            name: location.getNamespace().getLocal('ERROR'),
          },
          body: {
            type: 'BlockStatement',
            body: [makeFailureStatement(node, location)],
          },
        },
        finalizer: {
          type: 'BlockStatement',
          body: [makeLeaveStatement(node, location)],
        },
      },
    ],
  },
});

const makeVisitor = (visit) => (node, location) =>
  encapsulateResult(
    combineResult(
      makeClosure,
      node,
      location,
      node.type === 'ArrowFunctionExpression' || node.id === null
        ? getEmptyResult()
        : visit(node.id, location),
      node.params.map((child, index) =>
        index === node.params.length - 1
          ? visitRestablePattern(child, location)
          : visitPattern(child, location),
      ),
      node.type === 'ArrowFunctionExpression' && node.expression
        ? visitExpression(node.body, location)
        : visitBlockStatement(node.body, location),
    ),
    location,
  );

assignVisitorObject('Expression', {
  FunctionExpression: makeVisitor(visitNonScopingIdentifier),
  ArrowFunctionExpression: makeVisitor(null),
});

assignVisitorObject('Statement', {
  FunctionDeclaration: makeVisitor(visitScopingIdentifier),
});

assignVisitorObject('Method', {
  FunctionExpression: makeVisitor(null),
});
