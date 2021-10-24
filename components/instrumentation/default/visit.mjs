const _String = String;
const { isArray } = Array;
const { fromEntries, entries } = Object;

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

export default (dependencies) => {
  const {
    expect: { expect },
    util: { assert, hasOwnProperty, coalesce },
    source: { mapSource },
  } = dependencies;

  const makeCatchJumpStatement = (runtime) =>
    makeIfStatement(
      makeBinaryExpression(
        "!==",
        makeIdentifier(`${runtime}_JUMP_ID`),
        makeLiteral(null),
      ),
      makeBlockStatement([
        makeStatement(
          makeCallExpression(
            makeRegularMemberExpression(runtime, "recordAfterJump"),
            [makeIdentifier(`${runtime}_JUMP_ID`)],
          ),
        ),
        makeStatement(
          makeAssignmentExpression(
            makeIdentifier(`${runtime}_JUMP_ID`),
            makeLiteral(null),
          ),
        ),
      ]),
      null,
    );

  const makeJumpExpression = (expression, makeExpression, runtime) =>
    makeSequenceExpression([
      makeAssignmentExpression(makeIdentifier(`${runtime}_JUMP`), expression),
      makeAssignmentExpression(
        makeIdentifier(`${runtime}_JUMP_ID`),
        makeCallExpression(
          makeRegularMemberExpression(runtime, "recordBeforeJump"),
          [],
        ),
      ),
      makeAssignmentExpression(
        makeIdentifier(`${runtime}_JUMP`),
        makeExpression(makeIdentifier(`${runtime}_JUMP`)),
      ),
      makeCallExpression(
        makeRegularMemberExpression(runtime, "recordAfterJump"),
        [makeIdentifier(`${runtime}_JUMP_ID`)],
      ),
      makeAssignmentExpression(
        makeIdentifier(`${runtime}_JUMP_ID`),
        makeLiteral(null),
      ),
      makeIdentifier(`${runtime}_JUMP`),
    ]);

  // *NB*: This supposes that the surrounding function has been compiled!
  const compileReturn = (node, runtime) =>
    makeReturnStatement(
      makeAssignmentExpression(
        makeIdentifier(`${runtime}_SUCCESS`),
        node === null ? makeUnaryExpression("void", makeLiteral(0)) : node,
      ),
    );

  const compileParam = ({ type }, index, runtime) => {
    const pattern = makeIdentifier(`${runtime}_ARGUMENT_${_String(index)}`);
    return type === "RestElement" ? makeRestElement(pattern) : pattern;
  };

  const compileBody = (node, runtime) => {
    const { type } = node;
    if (type === "BlockStatement") {
      const { body } = node;
      return body;
    }
    return [compileReturn(node, runtime)];
  };

  const compileTryStatement = (node1, node2, node3, runtime) =>
    makeTryStatement(
      node1,
      makeCatchClause(
        makeIdentifier(`${runtime}_ERROR`),
        makeBlockStatement([
          makeCatchJumpStatement(runtime),
          ...(node2 === null || node2.param === null
            ? []
            : [
                makeVariableDeclaration("let", [
                  makeVariableDeclarator(
                    node2.param,
                    makeIdentifier(`${runtime}_ERROR`),
                  ),
                ]),
              ]),
          ...(node2 === null ? [] : [node2.body]),
        ]),
      ),
      node3,
    );

  const compileProgram = (type, nodes, runtime) => ({
    type: "Program",
    sourceType: type,
    body: [
      makeVariableDeclaration("let", [
        makeVariableDeclarator(
          makeIdentifier(`${runtime}_JUMP_ID`),
          makeLiteral(null),
        ),
      ]),
      ...nodes,
    ],
  });

  const compileFunction = (node, params, body, url, runtime) => ({
    type: node.type,
    id: coalesce(node, "id", null),
    expression: false,
    async: node.async,
    generator: node.generator,
    params: params.map((node, index) => compileParam(node, index, runtime)),
    body: makeBlockStatement([
      makeVariableDeclaration("var", [
        makeVariableDeclarator(
          makeIdentifier(`${runtime}_APPLY_ID`),
          makeCallExpression(
            makeRegularMemberExpression(runtime, "recordBeginApply"),
            [
              makeLiteral(url),
              makeThisExpression(),
              makeArrayExpression(
                params.map((param, index) =>
                  makeIdentifier(`${runtime}_ARGUMENT_${_String(index)}`),
                ),
              ),
            ],
          ),
        ),
        makeVariableDeclarator(
          makeIdentifier(`${runtime}_FAILURE`),
          makeRegularMemberExpression(runtime, "empty"),
        ),
        makeVariableDeclarator(
          makeIdentifier(`${runtime}_SUCCESS`),
          makeRegularMemberExpression(runtime, "empty"),
        ),
        makeVariableDeclarator(
          makeIdentifier(`${runtime}_JUMP`),
          makeLiteral(null),
        ),
        makeVariableDeclarator(
          makeIdentifier(`${runtime}_JUMP_ID`),
          makeLiteral(null),
        ),
      ]),
      makeTryStatement(
        makeBlockStatement([
          ...(params.length === 0
            ? []
            : [
                makeVariableDeclaration(
                  "var",
                  params.map((param, index) => {
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
                      const { left, right } = param;
                      return makeVariableDeclarator(
                        left,
                        makeConditionalExpression(
                          makeBinaryExpression(
                            "===",
                            makeIdentifier(
                              `${runtime}_ARGUMENT_${_String(index)}`,
                            ),
                            makeUnaryExpression("void", makeLiteral(0)),
                          ),
                          right,
                          makeIdentifier(
                            `${runtime}_ARGUMENT_${_String(index)}`,
                          ),
                        ),
                      );
                    }
                    return makeVariableDeclarator(
                      param,
                      makeIdentifier(`${runtime}_ARGUMENT_${_String(index)}`),
                    );
                  }),
                ),
              ]),
          ...compileBody(body, runtime),
        ]),
        makeCatchClause(
          makeIdentifier(`${runtime}_ERROR`),
          makeBlockStatement([
            makeCatchJumpStatement(runtime),
            makeThrowStatement(
              makeAssignmentExpression(
                makeIdentifier(`${runtime}_FAILURE`),
                makeIdentifier(`${runtime}_ERROR`),
              ),
            ),
          ]),
        ),
        makeBlockStatement([
          makeExpressionStatement(
            makeCallExpression(
              makeRegularMemberExpression(runtime, "recordEndApply"),
              [
                makeIdentifier(`${runtime}_APPLY_ID`),
                makeIdentifier(`${runtime}_FAILURE`),
                makeIdentifier(`${runtime}_SUCCESS`),
              ],
            ),
          ),
        ]),
      ),
    ]),
  });

  const visitGeneric = (node, instrumented, context) =>
    fromEntries(
      entries(node).map(([key, node]) => [
        key,
        visit(node, instrumented, context),
      ]),
    );

  const visit = (node, instrumented, context) => {
    if (isArray(node)) {
      return node.map((element) => visit(element, instrumented, context));
    }
    if (
      typeof node === "object" &&
      node !== null &&
      hasOwnProperty(node, "type")
    ) {
      const { type } = node;
      if (type === "Identifier") {
        const { url, runtime } = context;
        const {
          name,
          loc: {
            start: { line, column },
          },
        } = node;
        expect(
          !name.startsWith(runtime),
          "Identifier collision detected at %j line %j column %j >> identifier should not start with %j, got: %j",
          url,
          line,
          column,
          runtime,
          name,
        );
      }
      if (
        type === "ArrowFunctionExpression" ||
        type === "FunctionExpression" ||
        type === "FunctionDeclaration"
      ) {
        const { whitelist, mapping } = context;
        const {
          loc: {
            start: { line, column },
          },
        } = node;
        const location = mapSource(mapping, line, column);
        return location !== null && whitelist.has(location.url)
          ? compileFunction(
              node,
              visit(node.params, true, context),
              visit(node.body, true, context),
              `${location.url}#${_String(location.line)}-${_String(
                location.column,
              )}`,
              context.runtime,
            )
          : visitGeneric(node, false, context);
      }
      if (instrumented) {
        if (type === "Program") {
          return compileProgram(
            node.sourceType,
            visit(node.body, instrumented, context),
            context.runtime,
          );
        }
        if (type === "TryStatement") {
          return compileTryStatement(
            visit(node.block, instrumented, context),
            visit(node.handler, instrumented, context),
            visit(node.finalizer, instrumented, context),
            context.runtime,
          );
        }
        if (type === "AwaitExpression") {
          return makeJumpExpression(
            visit(node.argument, instrumented, context),
            makeAwaitExpression,
            context.runtime,
          );
        }
        if (type === "YieldExpression") {
          return makeJumpExpression(
            visit(node.argument, instrumented, context),
            (expression) => makeYieldExpression(node.delegate, expression),
            context.runtime,
          );
        }
        if (type === "ReturnStatement") {
          return compileReturn(
            visit(node.argument, instrumented, context),
            context.runtime,
          );
        }
      }
      return visitGeneric(node, instrumented, context);
    }
    return node;
  };
  return {
    visit: (node, context) => {
      assert(
        node.type === "Program",
        "expected program as top level estree node",
      );
      // Top level async jump only present in module.
      // Avoid poluting global scope in script.
      return visit(node, node.sourceType === "module", context);
    },
  };
};
