const _String = String;
const { isArray } = Array;
const { fromEntries } = Object;
const { ownKeys } = Reflect;

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

export default (dependencies) => {
  const {
    expect: { expect },
    url: { appendURLSegment },
    util: {
      mapMaybe,
      fromMaybe,
      assert,
      hasOwnProperty,
      coalesce,
      incrementCounter,
    },
    source: { mapSource },
    log: { logGuardDebug },
    location: { stringifyLocation, getLocationFileURL },
  } = dependencies;

  const isSubclassConstructor = (_node, parent, grand_parent) =>
    parent.type === "MethodDefinition" &&
    parent.kind === "constructor" &&
    grand_parent.superClass !== null;

  const isEstreeKey = (key) =>
    key !== "loc" && key !== "start" && key !== "end";

  const instrumentClosure = (node, parent, grand_parent, closure, context) => {
    const location = mapSource(
      context.mapping,
      node.loc.start.line,
      node.loc.start.column,
    );
    logGuardDebug(
      location === null,
      "Missing source map at file %j at line %j at column %j",
      context.url,
      node.loc.start.line,
      node.loc.start.column,
    );
    closure = {
      node,
      instrumented:
        context.apply &&
        location !== null &&
        context.whitelist.has(getLocationFileURL(location)),
    };
    if (closure.instrumented) {
      return makeClosure(
        node.type,
        node.async,
        node.generator,
        false,
        mapMaybe(coalesce(node, "id", null), (child) =>
          visit(child, node, parent, closure, context),
        ),
        node.params.map((param, index) => {
          const pattern = makeIdentifier(
            `${context.runtime}_ARGUMENT_${_String(index)}`,
          );
          return param.type === "RestElement"
            ? makeRestElement(pattern)
            : pattern;
        }),
        makeBlockStatement([
          makeVariableDeclaration("var", [
            makeVariableDeclarator(
              makeIdentifier(`${context.runtime}_BUNDLE_TAB`),
              makeCallExpression(
                makeRegularMemberExpression(context.runtime, "getFreshTab"),
                [],
              ),
            ),
            makeVariableDeclarator(
              makeIdentifier(`${context.runtime}_RETURN`),
              null,
            ),
            makeVariableDeclarator(
              makeIdentifier(`${context.runtime}_RETURNED`),
              makeLiteral(true),
            ),
            ...(node.generator
              ? [
                  makeVariableDeclarator(
                    makeIdentifier(`${context.runtime}_YIELD`),
                    null,
                  ),
                  makeVariableDeclarator(
                    makeIdentifier(`${context.runtime}_YIELD_TAB`),
                    null,
                  ),
                ]
              : []),
            ...(node.async
              ? [
                  makeVariableDeclarator(
                    makeIdentifier(`${context.runtime}_AWAIT`),
                    null,
                  ),
                  makeVariableDeclarator(
                    makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                    null,
                  ),
                ]
              : []),
          ]),
          makeExpressionStatement(
            makeCallExpression(
              makeRegularMemberExpression(context.runtime, "recordApply"),
              [
                makeIdentifier(`${context.runtime}_BUNDLE_TAB`),
                makeLiteral(stringifyLocation(location)),
                node.type === "ArrowFunctionExpression" ||
                isSubclassConstructor(node, parent, grand_parent)
                  ? makeRegularMemberExpression(context.runtime, "empty")
                  : makeThisExpression(),
                makeArrayExpression(
                  node.params.map((_param, index) =>
                    makeIdentifier(
                      `${context.runtime}_ARGUMENT_${_String(index)}`,
                    ),
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
                                  `${context.runtime}_ARGUMENT_${_String(
                                    index,
                                  )}`,
                                ),
                                makeUnaryExpression("void", makeLiteral(0)),
                              ),
                              param.right,
                              makeIdentifier(
                                `${context.runtime}_ARGUMENT_${_String(index)}`,
                              ),
                            ),
                          );
                        } else {
                          return makeVariableDeclarator(
                            param,
                            makeIdentifier(
                              `${context.runtime}_ARGUMENT_${_String(index)}`,
                            ),
                          );
                        }
                      }),
                    ),
                  ]),
              node.expression
                ? makeReturnStatement(
                    makeAssignmentExpression(
                      makeIdentifier(`${context.runtime}_RETURN`),
                      visit(node.body, node, parent, closure, context),
                    ),
                  )
                : visit(node.body, node, parent, closure, context),
            ]),
            makeCatchClause(
              makeIdentifier(`${context.runtime}_ERROR`),
              makeBlockStatement([
                ...(node.async
                  ? [
                      makeIfStatement(
                        makeBinaryExpression(
                          "!==",
                          makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                          makeUnaryExpression("void", makeLiteral(0)),
                        ),
                        makeBlockStatement([
                          makeStatement(
                            makeCallExpression(
                              makeRegularMemberExpression(
                                context.runtime,
                                "recordReject",
                              ),
                              [
                                makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                                makeIdentifier(`${context.runtime}_ERROR`),
                              ],
                            ),
                          ),
                        ]),
                        null,
                      ),
                    ]
                  : []),
                makeExpressionStatement(
                  makeAssignmentExpression(
                    makeIdentifier(`${context.runtime}_RETURNED`),
                    makeLiteral(false),
                  ),
                ),
                makeExpressionStatement(
                  makeCallExpression(
                    makeRegularMemberExpression(context.runtime, "recordThrow"),
                    [
                      makeIdentifier(`${context.runtime}_BUNDLE_TAB`),
                      makeLiteral(stringifyLocation(location)),
                      makeIdentifier(`${context.runtime}_ERROR`),
                    ],
                  ),
                ),
                makeThrowStatement(makeIdentifier(`${context.runtime}_ERROR`)),
              ]),
            ),
            makeBlockStatement([
              makeIfStatement(
                makeIdentifier(`${context.runtime}_RETURNED`),
                makeBlockStatement([
                  makeExpressionStatement(
                    makeCallExpression(
                      makeRegularMemberExpression(
                        context.runtime,
                        "recordReturn",
                      ),
                      [
                        makeIdentifier(`${context.runtime}_BUNDLE_TAB`),
                        makeLiteral(stringifyLocation(location)),
                        makeIdentifier(`${context.runtime}_RETURN`),
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
          visit(child, node, parent, closure, context),
        ),
        node.params.map((param) =>
          visit(param, node, parent, closure, context),
        ),
        visit(node.body, node, parent, closure, context),
      );
    }
  };

  const instrumenters = {
    AwaitExpression: (node, parent, _grand_parent, closure, context) =>
      closure.instrumented
        ? makeSequenceExpression([
            makeAssignmentExpression(
              makeIdentifier(`${context.runtime}_AWAIT`),
              visit(node.argument, node, parent, closure, context),
            ),
            makeAssignmentExpression(
              makeIdentifier(`${context.runtime}_AWAIT_TAB`),
              makeCallExpression(
                makeRegularMemberExpression(context.runtime, "getFreshTab"),
                [],
              ),
            ),
            makeCallExpression(
              makeRegularMemberExpression(context.runtime, "recordAwait"),
              [
                makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                makeIdentifier(`${context.runtime}_AWAIT`),
              ],
            ),
            makeAssignmentExpression(
              makeIdentifier(`${context.runtime}_AWAIT`),
              makeAwaitExpression(makeIdentifier(`${context.runtime}_AWAIT`)),
            ),
            makeCallExpression(
              makeRegularMemberExpression(context.runtime, "recordResolve"),
              [
                makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                makeIdentifier(`${context.runtime}_AWAIT`),
              ],
            ),
            makeAssignmentExpression(
              makeIdentifier(`${context.runtime}_AWAIT_TAB`),
              makeUnaryExpression("void", makeLiteral(0)),
            ),
            makeIdentifier(`${context.runtime}_AWAIT`),
          ])
        : null,
    YieldExpression: (node, parent, _grand_parent, closure, context) =>
      closure.instrumented
        ? makeSequenceExpression([
            makeAssignmentExpression(
              makeIdentifier(`${context.runtime}_YIELD`),
              visit(node.argument, node, parent, closure, context),
            ),
            makeAssignmentExpression(
              makeIdentifier(`${context.runtime}_YIELD_TAB`),
              makeCallExpression(
                makeRegularMemberExpression(context.runtime, "getFreshTab"),
                [],
              ),
            ),
            makeCallExpression(
              makeRegularMemberExpression(context.runtime, "recordYield"),
              [
                makeIdentifier(`${context.runtime}_YIELD_TAB`),
                makeLiteral(node.delegate),
                makeIdentifier(`${context.runtime}_YIELD`),
              ],
            ),
            makeYieldExpression(
              node.delegate,
              makeIdentifier(`${context.runtime}_YIELD`),
            ),
            makeCallExpression(
              makeRegularMemberExpression(context.runtime, "recordResume"),
              [makeIdentifier(`${context.runtime}_YIELD_TAB`)],
            ),
            makeUnaryExpression("void", makeLiteral(0)),
          ])
        : null,
    ReturnStatement: (node, parent, _grand_parent, closure, context) =>
      closure.instrumented && node.argument !== null
        ? makeReturnStatement(
            makeAssignmentExpression(
              makeIdentifier(`${context.runtime}_RETURN`),
              visit(node.argument, node, parent, closure, context),
            ),
          )
        : null,
    CallExpression: (node, parent, _grand_parent, closure, context) => {
      if (
        node.callee.type === "Identifier" &&
        context.evals.includes(node.callee.name) &&
        node.arguments.length > 0
      ) {
        const location = mapSource(
          context.mapping,
          node.loc.start.line,
          node.loc.start.column,
        );
        logGuardDebug(
          location === null,
          "Missing source map at file %j at line %j at column %j",
          context.url,
          node.loc.start.line,
          node.loc.start.column,
        );
        return makeCallExpression(makeIdentifier(node.callee.name), [
          makeCallExpression(makeIdentifier("APPMAP_HOOK_EVAL"), [
            makeLiteral(
              appendURLSegment(
                fromMaybe(location, context.url, getLocationFileURL),
                `eval-${_String(incrementCounter(context.counter))}`,
              ),
            ),
            visit(node.arguments[0], node, parent, closure, context),
          ]),
          ...node.arguments
            .slice(1)
            .map((argument) => visit(argument, node, parent, closure, context)),
        ]);
      } else {
        return null;
      }
    },
    TryStatement: (node, parent, _grand_parent, closure, context) => {
      if (
        closure.instrumented &&
        ((closure.node.type === "Program" &&
          closure.node.sourceType === "module") ||
          (hasOwnProperty(closure.node, "async") && closure.node.async))
      ) {
        return makeTryStatement(
          visit(node.block, node, parent, closure, context),
          makeCatchClause(
            makeIdentifier(`${context.runtime}_ERROR`),
            makeBlockStatement([
              makeIfStatement(
                makeBinaryExpression(
                  "!==",
                  makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                  makeUnaryExpression("void", makeLiteral(0)),
                ),
                makeBlockStatement([
                  makeStatement(
                    makeCallExpression(
                      makeRegularMemberExpression(
                        context.runtime,
                        "recordReject",
                      ),
                      [
                        makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                        makeIdentifier(`${context.runtime}_ERROR`),
                      ],
                    ),
                  ),
                  makeStatement(
                    makeAssignmentExpression(
                      makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                      makeUnaryExpression("void", makeLiteral(0)),
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
                              visit(
                                node.handler.param,
                                node.handler,
                                node,
                                closure,
                                context,
                              ),
                              makeIdentifier(`${context.runtime}_ERROR`),
                            ),
                          ]),
                        ]),
                    visit(
                      node.handler.body,
                      node.handler,
                      node,
                      closure,
                      context,
                    ),
                  ]),
            ]),
          ),
          node.finalizer === null
            ? null
            : visit(node.finalizer, node, parent, closure, context),
        );
      } else {
        return null;
      }
    },
    Identifier: (node, _parent, _grand_parent, _closure, context) => {
      expect(
        !node.name.startsWith(context.runtime),
        "Identifier collision detected at %j line %j column %j >> identifier should not start with %j, got: %j",
        context.url,
        node.loc.start.line,
        node.loc.start.column,
        context.runtime,
        node.name,
      );
      return null;
    },
    Program: (node, parent, _grand_parent, closure, context) =>
      closure.instrumented && node.sourceType === "module"
        ? makeProgram("module", [
            makeVariableDeclaration("let", [
              makeVariableDeclarator(
                makeIdentifier(`${context.runtime}_BUNDLE_TAB`),
                makeCallExpression(
                  makeRegularMemberExpression(context.runtime, "getFreshTab"),
                  [],
                ),
              ),
              makeVariableDeclarator(
                makeIdentifier(`${context.runtime}_AWAIT`),
                null,
              ),
              makeVariableDeclarator(
                makeIdentifier(`${context.runtime}_AWAIT_TAB`),
                null,
              ),
            ]),
            ...node.body.map((child) =>
              visit(child, node, parent, closure, context),
            ),
          ])
        : null,
    FunctionExpression: instrumentClosure,
    FunctionDeclaration: instrumentClosure,
    ArrowFunctionExpression: instrumentClosure,
  };

  const visitGeneric = (node, parent, _grand_parent, closure, context) =>
    fromEntries(
      ownKeys(node)
        .filter(isEstreeKey)
        .map((key) => [key, visit(node[key], node, parent, closure, context)]),
    );

  const visit = (node, parent, grand_parent, closure, context) => {
    if (isArray(node)) {
      return node.map((node) =>
        visit(node, parent, grand_parent, closure, context),
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

  const initial_parent = { type: "File" };

  const initial_grand_parent = { type: "Root" };

  return {
    visit: (node, context) => {
      assert(
        node.type === "Program",
        "expected program as top level estree node",
      );
      // Top level async jump only present in module.
      // Avoid poluting global scope in script.
      return visit(
        node,
        initial_parent,
        initial_grand_parent,
        {
          node,
          instrumented: context.apply && node.sourceType === "module",
        },
        context,
      );
    },
  };
};
