import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import {
  mapMaybe,
  assert,
  hasOwnProperty,
  coalesce,
} from "../../util/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { stringifyLocation } from "../../location/index.mjs";
import { resolveClosureLocation } from "./codebase.mjs";

const {
  Error,
  String,
  Array: { isArray },
  Object: { fromEntries },
  Reflect: { ownKeys },
} = globalThis;

//////////////////////////////
// Difficulties with groups //
//////////////////////////////

// import {createHook, executionAsyncId} from "async_hooks";
// createHook({}).enable();
// import {writeFileSync} from "fs";
// const {stdout:{fd}} = process;
// const log = (string) => writeFileSync(fd, `[${executionAsyncId()}] ${string}\n`);
// const logAwait = async (promise) => {
//   log("before");
//   try {
//     await promise;
//   } finally {
//     log("after");
//   }
// };
// const mainAsync = async () => {
//   log("begin");
//   try {
//     await logAwait(new Promise((resolve) => {
//       setTimeout(resolve, 1000, 123);
//     }));
//   } finally {
//     log("end");
//   }
// };
// await mainAsync();

// import {createHook, executionAsyncId} from "async_hooks";
// createHook({}).enable();
// import {writeFileSync} from "fs";
// const {stdout:{fd}} = process;
// const log = (string) => writeFileSync(fd, `[${executionAsyncId()}] ${string}\n`);
// function* logYield (result) {
//   log("before");
//   yield result;
//   log("after");
// };
// async function* main () {
//   log("begin");
//   yield* logYield(123);
//   log("end");
// }
// const iterator = main();
// iterator.next();
// iterator.next();

/////////////
// Builder //
/////////////

const makeProgram = (source, body) => ({
  type: "Program",
  sourceType: source,
  body,
});

const makeClosure = (
  type,
  asynchronous,
  generator,
  expression,
  id,
  params,
  body,
) => ({
  type,
  async: asynchronous,
  generator,
  expression,
  id,
  params,
  body,
});

const makeSequenceExpression = (nodes) => ({
  type: "SequenceExpression",
  expressions: nodes,
});

const makeStatement = (node) => ({
  type: "ExpressionStatement",
  expression: node,
});

const makeIfStatement = (node1, node2, node3) => ({
  type: "IfStatement",
  test: node1,
  consequent: node2,
  alternate: node3,
});

const makeBlockStatement = (nodes) => ({
  type: "BlockStatement",
  body: nodes,
});

const makeAwaitExpression = (node) => ({
  type: "AwaitExpression",
  argument: node,
});

const makeYieldExpression = (delegate, node) => ({
  type: "YieldExpression",
  delegate,
  argument: node,
});

const makeConditionalExpression = (node1, node2, node3) => ({
  type: "ConditionalExpression",
  test: node1,
  consequent: node2,
  alternate: node3,
});

const makeLogicalExpression = (operator, node1, node2) => ({
  type: "LogicalExpression",
  operator,
  left: node1,
  right: node2,
});

const makeCatchClause = (node1, node2) => ({
  type: "CatchClause",
  param: node1,
  body: node2,
});

const makeTryStatement = (node1, node2, node3) => ({
  type: "TryStatement",
  block: node1,
  handler: node2,
  finalizer: node3,
});

const makeRestElement = (node) => ({
  type: "RestElement",
  argument: node,
});

const makeUnaryExpression = (operator, node) => ({
  type: "UnaryExpression",
  prefix: true,
  operator,
  argument: node,
});

const makeBinaryExpression = (operator, node1, node2) => ({
  type: "BinaryExpression",
  operator,
  left: node1,
  right: node2,
});

const makeAssignmentExpression = (node1, node2) => ({
  type: "AssignmentExpression",
  operator: "=",
  left: node1,
  right: node2,
});

const makeArrayExpression = (nodes) => ({
  type: "ArrayExpression",
  elements: nodes,
});

const makeThisExpression = () => ({
  type: "ThisExpression",
});

const makeIdentifier = (name) => ({
  type: "Identifier",
  name,
});

const makeLiteral = (name) => ({
  type: "Literal",
  value: name,
});

const makeVariableDeclaration = (kind, nodes) => ({
  type: "VariableDeclaration",
  kind,
  declarations: nodes,
});

const makeThrowStatement = (node) => ({
  type: "ThrowStatement",
  argument: node,
});

const makeVariableDeclarator = (node1, node2) => ({
  type: "VariableDeclarator",
  id: node1,
  init: node2,
});

const makeCallExpression = (node, nodes) => ({
  type: "CallExpression",
  optional: false,
  callee: node,
  arguments: nodes,
});

const makeExpressionStatement = (node) => ({
  type: "ExpressionStatement",
  expression: node,
});

const makeRegularMemberExpression = (name1, name2) => ({
  type: "MemberExpression",
  optional: false,
  computed: false,
  object: makeIdentifier(name1),
  property: makeIdentifier(name2),
});

const makeReturnStatement = (argument) => ({
  type: "ReturnStatement",
  argument,
});

///////////////
// Component //
///////////////

const isJumpClosureNode = (node) => {
  if (node.type === "Program") {
    return node.sourceType === "module";
  } else if (
    node.type === "FunctionExpression" ||
    node.type === "FunctionDeclaration"
  ) {
    return node.async || node.generator;
  } else if (node.type === "ArrowFunctionExpression") {
    return node.async;
  } /* c8 ignore start */ else {
    throw new Error("unexpected closure node");
  } /* c8 ignore stop */
};

const isSubclassConstructor = (_node, parent, grand_parent) =>
  parent.type === "MethodDefinition" &&
  parent.kind === "constructor" &&
  grand_parent.superClass !== null;

const isEstreeKey = (key) => key !== "loc" && key !== "start" && key !== "end";

/* eslint-disable no-use-before-define */
const visitNode = (node, parent, grand_parent, closure, context) => {
  if (isArray(node)) {
    return node.map((node) =>
      visitNode(node, parent, grand_parent, closure, context),
    );
  } else if (
    typeof node === "object" &&
    node !== null &&
    hasOwnProperty(node, "type")
  ) {
    if (hasOwnProperty(instrumenters, node.type)) {
      const maybe_node = instrumenters[node.type](
        node,
        parent,
        grand_parent,
        closure,
        context,
      );
      return maybe_node === null
        ? visitGeneric(node, parent, grand_parent, closure, context)
        : maybe_node;
    } else {
      return visitGeneric(node, parent, grand_parent, closure, context);
    }
  } else {
    return node;
  }
};
/* eslint-enable no-use-before-define */

const visitGeneric = (node, parent, _grand_parent, closure, context) =>
  fromEntries(
    ownKeys(node)
      .filter(isEstreeKey)
      .map((key) => [
        key,
        visitNode(node[key], node, parent, closure, context),
      ]),
  );

const instrumentClosure = (node, parent, grand_parent, closure, context) => {
  const maybe_location = resolveClosureLocation(
    context.codebase,
    node.loc.start,
  );
  closure = {
    node,
    instrumented: context.apply !== null && maybe_location !== null,
  };
  if (closure.instrumented) {
    const location_string = stringifyLocation(maybe_location);
    return makeClosure(
      node.type,
      node.async,
      node.generator,
      false,
      mapMaybe(coalesce(node, "id", null), (child) =>
        visitNode(child, node, parent, closure, context),
      ),
      node.params.map((param, index) => {
        const pattern = makeIdentifier(
          `${context.apply}_ARGUMENT_${String(index)}`,
        );
        return param.type === "RestElement"
          ? makeRestElement(pattern)
          : pattern;
      }),
      makeBlockStatement([
        makeVariableDeclaration("var", [
          makeVariableDeclarator(
            makeIdentifier(`${context.apply}_BUNDLE_TAB`),
            makeCallExpression(
              makeRegularMemberExpression(context.apply, "getFreshTab"),
              [],
            ),
          ),
          makeVariableDeclarator(
            makeIdentifier(`${context.apply}_RESULT`),
            null,
          ),
          makeVariableDeclarator(
            makeIdentifier(`${context.apply}_DONE`),
            makeLiteral(false),
          ),
          ...(isJumpClosureNode(node)
            ? [
                makeVariableDeclarator(
                  makeIdentifier(`${context.apply}_JUMP`),
                  null,
                ),
                makeVariableDeclarator(
                  makeIdentifier(`${context.apply}_JUMP_TAB`),
                  makeLiteral(null),
                ),
              ]
            : []),
        ]),
        makeExpressionStatement(
          makeCallExpression(
            makeRegularMemberExpression(context.apply, "recordApply"),
            [
              makeIdentifier(`${context.apply}_BUNDLE_TAB`),
              makeLiteral(location_string),
              node.type === "ArrowFunctionExpression" ||
              isSubclassConstructor(node, parent, grand_parent)
                ? makeRegularMemberExpression(context.apply, "empty")
                : makeThisExpression(),
              makeArrayExpression(
                node.params.map((_param, index) =>
                  makeIdentifier(`${context.apply}_ARGUMENT_${String(index)}`),
                ),
              ),
            ],
          ),
        ),
        makeTryStatement(
          makeBlockStatement([
            ...(node.params.length === 0
              ? []
              : [
                  makeVariableDeclaration(
                    "var",
                    node.params.map((param, index) => {
                      if (param.type === "RestElement") {
                        param = param.argument;
                      }
                      // Special case for AssignmentPattern:
                      //
                      // function f (x = {}) {}
                      //
                      // function f (APPMAP_ARGUMENT_0) {
                      //   // does not work :(
                      //   var x = {} = APPMAP_ARGUMENT_0;
                      // }
                      if (param.type === "AssignmentPattern") {
                        return makeVariableDeclarator(
                          param.left,
                          makeConditionalExpression(
                            makeBinaryExpression(
                              "===",
                              makeIdentifier(
                                `${context.apply}_ARGUMENT_${String(index)}`,
                              ),
                              makeUnaryExpression("void", makeLiteral(0)),
                            ),
                            param.right,
                            makeIdentifier(
                              `${context.apply}_ARGUMENT_${String(index)}`,
                            ),
                          ),
                        );
                      } else {
                        return makeVariableDeclarator(
                          param,
                          makeIdentifier(
                            `${context.apply}_ARGUMENT_${String(index)}`,
                          ),
                        );
                      }
                    }),
                  ),
                ]),
            node.expression
              ? makeReturnStatement(
                  makeAssignmentExpression(
                    makeIdentifier(`${context.apply}_RESULT`),
                    visitNode(node.body, node, parent, closure, context),
                  ),
                )
              : visitNode(node.body, node, parent, closure, context),
          ]),
          makeCatchClause(
            makeIdentifier(`${context.apply}_ERROR`),
            makeBlockStatement([
              ...(isJumpClosureNode(node)
                ? [
                    makeIfStatement(
                      makeBinaryExpression(
                        "!==",
                        makeIdentifier(`${context.apply}_JUMP_TAB`),
                        makeLiteral(null),
                      ),
                      makeBlockStatement([
                        makeStatement(
                          makeCallExpression(
                            makeRegularMemberExpression(
                              context.apply,
                              "recordReject",
                            ),
                            [
                              makeIdentifier(`${context.apply}_JUMP_TAB`),
                              makeIdentifier(`${context.apply}_ERROR`),
                            ],
                          ),
                        ),
                        makeStatement(
                          makeAssignmentExpression(
                            makeIdentifier(`${context.apply}_JUMP_TAB`),
                            makeLiteral(null),
                          ),
                        ),
                      ]),
                      null,
                    ),
                  ]
                : []),
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeIdentifier(`${context.apply}_DONE`),
                  makeLiteral(true),
                ),
              ),
              makeExpressionStatement(
                makeCallExpression(
                  makeRegularMemberExpression(context.apply, "recordThrow"),
                  [
                    makeIdentifier(`${context.apply}_BUNDLE_TAB`),
                    makeLiteral(location_string),
                    makeIdentifier(`${context.apply}_ERROR`),
                  ],
                ),
              ),
              makeThrowStatement(makeIdentifier(`${context.apply}_ERROR`)),
            ]),
          ),
          makeBlockStatement([
            ...(isJumpClosureNode(node)
              ? [
                  makeIfStatement(
                    makeBinaryExpression(
                      "!==",
                      makeIdentifier(`${context.apply}_JUMP_TAB`),
                      makeLiteral(null),
                    ),
                    makeBlockStatement([
                      makeStatement(
                        makeCallExpression(
                          makeRegularMemberExpression(
                            context.apply,
                            "recordResolve",
                          ),
                          [
                            makeIdentifier(`${context.apply}_JUMP_TAB`),
                            makeRegularMemberExpression(context.apply, "empty"),
                          ],
                        ),
                      ),
                      makeStatement(
                        makeAssignmentExpression(
                          makeIdentifier(`${context.apply}_JUMP_TAB`),
                          makeLiteral(null),
                        ),
                      ),
                    ]),
                    null,
                  ),
                ]
              : []),
            makeIfStatement(
              makeUnaryExpression("!", makeIdentifier(`${context.apply}_DONE`)),
              makeBlockStatement([
                makeExpressionStatement(
                  makeCallExpression(
                    makeRegularMemberExpression(context.apply, "recordReturn"),
                    [
                      makeIdentifier(`${context.apply}_BUNDLE_TAB`),
                      makeLiteral(location_string),
                      makeIdentifier(`${context.apply}_RESULT`),
                    ],
                  ),
                ),
              ]),
              null,
            ),
          ]),
        ),
      ]),
    );
  } else {
    return makeClosure(
      node.type,
      node.async,
      node.generator,
      node.expression,
      mapMaybe(node.id, (child) =>
        visitNode(child, node, parent, closure, context),
      ),
      node.params.map((param) =>
        visitNode(param, node, parent, closure, context),
      ),
      visitNode(node.body, node, parent, closure, context),
    );
  }
};

const compileInstrumentJumpExpression =
  (makeRecordJumpExpression, makeForwardJumpExpression) =>
  (node, parent, _grand_parent, closure, context) =>
    closure.instrumented
      ? makeSequenceExpression([
          makeAssignmentExpression(
            makeIdentifier(`${context.apply}_JUMP`),
            visitNode(node.argument, node, parent, closure, context),
          ),
          makeLogicalExpression(
            "||",
            makeBinaryExpression(
              "===",
              makeIdentifier(`${context.apply}_JUMP_TAB`),
              makeLiteral(null),
            ),
            makeIdentifier(`${context.apply}_APPMAP_JUMP_ASSERTION_VIOLATION`),
          ),
          makeAssignmentExpression(
            makeIdentifier(`${context.apply}_JUMP_TAB`),
            makeCallExpression(
              makeRegularMemberExpression(context.apply, "getFreshTab"),
              [],
            ),
          ),
          makeRecordJumpExpression(node, context.apply),
          makeAssignmentExpression(
            makeIdentifier(`${context.apply}_JUMP`),
            makeForwardJumpExpression(node, context.apply),
          ),
          makeCallExpression(
            makeRegularMemberExpression(context.apply, "recordResolve"),
            [
              makeIdentifier(`${context.apply}_JUMP_TAB`),
              makeIdentifier(`${context.apply}_JUMP`),
            ],
          ),
          makeAssignmentExpression(
            makeIdentifier(`${context.apply}_JUMP_TAB`),
            makeLiteral(null),
          ),
          makeIdentifier(`${context.apply}_JUMP`),
        ])
      : null;

const instrumenters = {
  AwaitExpression: compileInstrumentJumpExpression(
    (_node, namespace) =>
      makeCallExpression(
        makeRegularMemberExpression(namespace, "recordAwait"),
        [
          makeIdentifier(`${namespace}_JUMP_TAB`),
          makeIdentifier(`${namespace}_JUMP`),
        ],
      ),
    (_node, namespace) =>
      makeAwaitExpression(makeIdentifier(`${namespace}_JUMP`)),
  ),
  YieldExpression: compileInstrumentJumpExpression(
    ({ delegate }, namespace) =>
      makeCallExpression(
        makeRegularMemberExpression(namespace, "recordYield"),
        [
          makeIdentifier(`${namespace}_JUMP_TAB`),
          makeLiteral(delegate),
          makeIdentifier(`${namespace}_JUMP`),
        ],
      ),
    ({ delegate }, namespace) =>
      makeYieldExpression(delegate, makeIdentifier(`${namespace}_JUMP`)),
  ),
  ReturnStatement: (node, parent, _grand_parent, closure, context) =>
    closure.instrumented && node.argument !== null
      ? makeReturnStatement(
          makeAssignmentExpression(
            makeIdentifier(`${context.apply}_RESULT`),
            visitNode(node.argument, node, parent, closure, context),
          ),
        )
      : null,
  CallExpression: (node, parent, _grand_parent, closure, context) => {
    if (
      node.callee.type === "Identifier" &&
      context.eval.aliases.includes(node.callee.name) &&
      node.arguments.length > 0
    ) {
      return makeCallExpression(makeIdentifier(node.callee.name), [
        makeCallExpression(makeIdentifier(context.eval.hidden), [
          makeLiteral(context.url),
          makeLiteral(
            `${String(node.loc.start.line)}-${String(node.loc.start.column)}`,
          ),
          visitNode(node.arguments[0], node, parent, closure, context),
        ]),
        ...node.arguments
          .slice(1)
          .map((argument) =>
            visitNode(argument, node, parent, closure, context),
          ),
      ]);
    } else {
      return null;
    }
  },
  TryStatement: (node, parent, _grand_parent, closure, context) => {
    if (closure.instrumented && isJumpClosureNode(closure.node)) {
      return makeTryStatement(
        visitNode(node.block, node, parent, closure, context),
        makeCatchClause(
          makeIdentifier(`${context.apply}_ERROR`),
          makeBlockStatement([
            makeIfStatement(
              makeBinaryExpression(
                "!==",
                makeIdentifier(`${context.apply}_JUMP_TAB`),
                makeLiteral(null),
              ),
              makeBlockStatement([
                makeStatement(
                  makeCallExpression(
                    makeRegularMemberExpression(context.apply, "recordReject"),
                    [
                      makeIdentifier(`${context.apply}_JUMP_TAB`),
                      makeIdentifier(`${context.apply}_ERROR`),
                    ],
                  ),
                ),
                makeStatement(
                  makeAssignmentExpression(
                    makeIdentifier(`${context.apply}_JUMP_TAB`),
                    makeLiteral(null),
                  ),
                ),
              ]),
              null,
            ),
            ...(node.handler === null
              ? []
              : [
                  ...(node.handler.param === null
                    ? []
                    : [
                        makeVariableDeclaration("let", [
                          makeVariableDeclarator(
                            visitNode(
                              node.handler.param,
                              node.handler,
                              node,
                              closure,
                              context,
                            ),
                            makeIdentifier(`${context.apply}_ERROR`),
                          ),
                        ]),
                      ]),
                  visitNode(
                    node.handler.body,
                    node.handler,
                    node,
                    closure,
                    context,
                  ),
                ]),
          ]),
        ),
        makeBlockStatement([
          makeIfStatement(
            makeBinaryExpression(
              "!==",
              makeIdentifier(`${context.apply}_JUMP_TAB`),
              makeLiteral(null),
            ),
            makeBlockStatement([
              makeStatement(
                makeCallExpression(
                  makeRegularMemberExpression(context.apply, "recordResolve"),
                  [
                    makeIdentifier(`${context.apply}_JUMP_TAB`),
                    makeRegularMemberExpression(context.apply, "empty"),
                  ],
                ),
              ),
              makeStatement(
                makeAssignmentExpression(
                  makeIdentifier(`${context.apply}_JUMP_TAB`),
                  makeLiteral(null),
                ),
              ),
            ]),
            null,
          ),
          ...(node.finalizer === null
            ? []
            : [visitNode(node.finalizer, node, parent, closure, context)]),
        ]),
      );
    } else {
      return null;
    }
  },
  Identifier: (node, _parent, _grand_parent, _closure, context) => {
    assert(
      !logErrorWhen(
        node.name.startsWith(context.apply),
        "Identifier collision detected at %j line %j column %j >> identifier should not start with %j, got: %j",
        context.url,
        node.loc.start.line,
        node.loc.start.column,
        context.apply,
        node.name,
      ),
      "Identifier collision",
      ExternalAppmapError,
    );
    return null;
  },
  Program: (node, parent, _grand_parent, closure, context) =>
    closure.instrumented && node.sourceType === "module"
      ? makeProgram("module", [
          makeVariableDeclaration("let", [
            makeVariableDeclarator(
              makeIdentifier(`${context.apply}_BUNDLE_TAB`),
              makeCallExpression(
                makeRegularMemberExpression(context.apply, "getFreshTab"),
                [],
              ),
            ),
            makeVariableDeclarator(
              makeIdentifier(`${context.apply}_JUMP`),
              null,
            ),
            makeVariableDeclarator(
              makeIdentifier(`${context.apply}_JUMP_TAB`),
              makeLiteral(null),
            ),
          ]),
          ...node.body.map((child) =>
            visitNode(child, node, parent, closure, context),
          ),
        ])
      : null,
  FunctionExpression: instrumentClosure,
  FunctionDeclaration: instrumentClosure,
  ArrowFunctionExpression: instrumentClosure,
};

const initial_parent = { type: "File" };

const initial_grand_parent = { type: "Root" };

export const visit = (node, context) => {
  assert(
    node.type === "Program",
    "expected program as top level estree node",
    InternalAppmapError,
  );
  // Top level async jump only present in module.
  // Avoid poluting global scope in script.
  return visitNode(
    node,
    initial_parent,
    initial_grand_parent,
    {
      node,
      instrumented: context.apply !== null && node.sourceType === "module",
    },
    context,
  );
};
