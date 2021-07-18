import { generate } from "escodegen";

/////////////
// Builder //
/////////////

const makeBlockStatement = (nodes) => ({
  type: "BlockStatement",
  body: nodes,
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

const makeAssignmentExpression = (operator, node1, node2) => ({
  type: "AssignmentExpression",
  operator,
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

const bypassRestElement = (node) =>
  node.type === "RestElement" ? node.argument : node;

export default (dependencies) => {
  const {
    util: { coalesce },
  } = dependencies;

  const assembleReturn = (node, argument, { runtime }) =>
    makeReturnStatement(
      makeAssignmentExpression(
        "=",
        makeIdentifier(`${runtime}_SUCCESS`),
        argument === null
          ? makeUnaryExpression("void", makeLiteral(0))
          : argument,
      ),
    );

  const visitor = {
    extract: null,
    dismantle: ({ id, params, body }) => [
      id,
      params.map(bypassRestElement),
      body,
    ],
    assemble: (node, [id, params, body], context, entity) => {
      const { runtime } = context;
      const { index } = entity;
      return {
        type: node.type,
        id,
        expression: false,
        async: node.async,
        generator: node.generator,
        params: node.params.map(({ type }, index) => {
          const pattern = makeIdentifier(
            `${runtime}_ARGUMENT_${String(index)}`,
          );
          return type === "RestElement" ? makeRestElement(pattern) : pattern;
        }),
        body: makeBlockStatement([
          makeVariableDeclaration("var", [
            makeVariableDeclarator(
              makeIdentifier(`${runtime}_AFTER_ID`),
              makeCallExpression(
                makeRegularMemberExpression(runtime, "recordBeforeApply"),
                [
                  makeLiteral(index),
                  makeThisExpression(),
                  makeArrayExpression(
                    params.map((param, index) =>
                      makeIdentifier(`${runtime}_ARGUMENT_${String(index)}`),
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
          ]),
          makeTryStatement(
            makeBlockStatement([
              ...(params.length === 0
                ? []
                : [
                    makeVariableDeclaration(
                      "var",
                      params.map((param, index) => {
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
                                  `${runtime}_ARGUMENT_${String(index)}`,
                                ),
                                makeUnaryExpression("void", makeLiteral(0)),
                              ),
                              right,
                              makeIdentifier(
                                `${runtime}_ARGUMENT_${String(index)}`,
                              ),
                            ),
                          );
                        }
                        return makeVariableDeclarator(
                          param,
                          makeIdentifier(
                            `${runtime}_ARGUMENT_${String(index)}`,
                          ),
                        );
                      }),
                    ),
                  ]),
              ...(body.type === "BlockStatement"
                ? body.body
                : [assembleReturn(body, node.body, context, entity)]),
            ]),
            makeCatchClause(
              makeIdentifier(`${runtime}_ERROR`),
              makeBlockStatement([
                makeThrowStatement(
                  makeAssignmentExpression(
                    "=",
                    makeIdentifier(`${runtime}_FAILURE`),
                    makeIdentifier(`${runtime}_ERROR`),
                  ),
                ),
              ]),
            ),
            makeBlockStatement([
              makeExpressionStatement(
                makeCallExpression(
                  makeRegularMemberExpression(runtime, "recordAfterApply"),
                  [
                    makeIdentifier(`${runtime}_AFTER_ID`),
                    makeIdentifier(`${runtime}_FAILURE`),
                    makeIdentifier(`${runtime}_SUCCESS`),
                  ],
                ),
              ),
            ]),
          ),
        ]),
      };
    },
    sieve: (outlines) => [outlines, []],
  };

  return {
    ReturnStatement: {
      dismantle: ({ argument }) => argument,
      assemble: assembleReturn,
    },
    ArrowFunctionExpression: {
      ...visitor,
      extract: ({ head: { params } }) => ({
        name: null,
        params: params.map(generate),
        static: false,
      }),
      dismantle: ({ params, body }) => [
        null,
        params.map(bypassRestElement),
        body,
      ],
    },
    FunctionExpression: {
      ...visitor,
      extract: ({ head: { params, id }, tail: { head: parent } }) => {
        const { type } = parent;
        let _static = false;
        if (type === "MethodDefinition") {
          ({ static: _static } = parent);
        }
        return {
          name: coalesce(id, "name", null),
          params: params.map(generate),
          static: _static,
        };
      },
    },
    FunctionDeclaration: {
      ...visitor,
      extract: ({ head: { params, id } }) => ({
        name: coalesce(id, "name", null),
        params: params.map(generate),
        static: false,
      }),
    },
  };
};
