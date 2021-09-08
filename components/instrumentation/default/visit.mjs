import Clash from "./clash.mjs";

const _String = String;
const { isArray } = Array;
const { fromEntries, entries } = Object;

/////////////
// Builder //
/////////////

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

export default (dependencies) => {
  const {
    naming: { getQualifiedName, isExcluded },
    util: { hasOwnProperty, coalesce },
  } = dependencies;

  const { checkIdentifierClash } = Clash(dependencies);

  // *NB*: This supposes that the surrounding function has been compiled!
  const compileReturn = (node, runtime) =>
    makeReturnStatement(
      makeAssignmentExpression(
        "=",
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

  const compileFunction = (node, params, body, route, { runtime }) => ({
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
              makeLiteral(route),
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

  const visit = (node, route, lineage, context) => {
    if (isArray(node)) {
      return node.map((element, index) =>
        visit(element, `${route}/${_String(index)}`, lineage, context),
      );
    }
    if (
      typeof node === "object" &&
      node !== null &&
      hasOwnProperty(node, "type")
    ) {
      lineage = { head: node, tail: lineage };
      checkIdentifierClash(lineage, context);
      const { type } = node;
      const { runtime, exclusion, naming } = context;
      if (isExcluded(exclusion, getQualifiedName(naming, lineage))) {
        return node;
      }
      if (type === "AwaitExpression") {
        const { argument } = node;
        return makeAwaitExpression(
          makeCallExpression(
            makeRegularMemberExpression(runtime, "recordAwait"),
            [
              makeIdentifier(`${runtime}_APPLY_ID`),
              visit(argument, `${route}/argument`, lineage, context),
            ],
          ),
        );
      }
      if (type === "YieldExpression") {
        const { argument, delegate } = node;
        return makeYieldExpression(
          true,
          makeCallExpression(
            makeRegularMemberExpression(
              runtime,
              delegate ? "recordYieldAll" : "recordYield",
            ),
            [
              makeIdentifier(`${runtime}_APPLY_ID`),
              visit(argument, `${route}/argument`, lineage, context),
            ],
          ),
        );
      }
      if (type === "ReturnStatement") {
        const { argument } = node;
        return compileReturn(
          visit(argument, `${route}/argument`, lineage, context),
          runtime,
        );
      }
      if (
        type === "ArrowFunctionExpression" ||
        type === "FunctionExpression" ||
        type === "FunctionDeclaration"
      ) {
        const { params, body } = node;
        return compileFunction(
          node,
          params.map((node, index) =>
            visit(node, `${route}/params/${index}`, lineage, context),
          ),
          visit(body, `${route}/body`, lineage, context),
          route,
          context,
        );
      }
      return fromEntries(
        entries(node).map(([key, node]) => [
          key,
          visit(node, `${route}/${key}`, lineage, context),
        ]),
      );
    }
    return node;
  };

  return { visit };
};
