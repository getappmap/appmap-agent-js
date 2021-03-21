
import Logger from "../logger.mjs";
import visitExpression from  "./visit-expression.mjs";
import visitStatement from "./visit-statement.mjs";

const logger = new Logger(import.meta.url);

/////////////
// Builder //
/////////////

const makeRegularProperty = (name, node) => ({
  type: "Property",
  kind: "init",
  computed: false,
  shorthand: false,
  method: false,
  key: {
    type: "Identifier",
    name
  },
  value: node
});

const makeRegularVariableDeclarator = (name, node) => ({
  type: "VariableDeclaratior",
  id: {
    type: "Identifier",
    name: name
  },
  init: node
});

/////////////
// Success //
/////////////

export const visitReturnStatement = (node, location) => {
  if (node.type !== "ReturnStatement") {
    logger.error(`Invalid ReturnStatement node, got: ${node.type}`);
    return {
      node: Dummy.getReturnStatementNode(),
      entities: []
    };
  }
  let pair;
  if (node.argument === null) {
    pair = {
      node: {
        type: "UnaryExpression",
        operator: "void",
        prefix: true,
        argument: {
          type: "Literal",
          value: 0
        }
      },
      entities: []
    };
  } else {
    pair = visitExpression(node.argument, location, Context.getVoidContext());
  }
  return {
    node: {
      type: "ReturnStatement",
      argument: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: 
        },
        right: pair.node
      },
    },
    entities: pair.entities
  };
};

// let
//   APPMAP_LOCAL_TIMER = APPMAP_GLOBAL_GET_NOW();
//   APPMAP_LOCAL_EVENT_IDENTITY = ++APPMAP_GLOBAL_EVENT_COUNTER,
//   APPMAP_LOCAL_SUCCESS = APPMAP_GLOBAL_EMPTY_MARKER,
//   APPMAP_LOCAL_FAILURE = APPMAP_GLOBAL_EMPTY_MARKER;
const makeSetupStatement = (node, location) => {
  type: "VariableDeclaration",
  kind: location.getFile().getLanguageVersion() < 2015 ? "var" : "let",
  declarations: [
    makeRegularVariableDeclarator(namespace.getLocal("TIMER"), {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: namespace.getGlobal("GET_NOW")
      },
      arguments: []
    }),
    makeRegularVariableDeclarator(namespace.getLocal("EVENT_IDENTITY"), {
      type: "UpdateExpression",
      prefix: true,
      operator: "++",
      argument: {
        type: "Identifier",
        name: namespace.getGlobal("EVENT_COUNTER")
      }
    }),
    makeRegularVariableDeclarator(namespace.getLocal("SUCCESS"), {
      type: "Identifier",
      name: namespace.getGlobal("EMPTY_MARKER")
    }),
    makeRegularVariableDeclarator(namespace.getLocal("FAILURE"), {
      type: "Identifier",
      name: namespace.getGlobal("EMPTY_MARKER")
    })
  ]
};

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
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: location.getNamespace().getGlobal("ADD_EVENT")
    },
    arguments: [{
      type: "ObjectExpression",
      properties: [
        makeRegularProperty("id", {
          type: "identifier",
          name: location.getNamespace().getLocal("EVENT_IDENTITY"),
        }),
        makeRegularProperty("event", {
          type: "Literal",
          value: "call"
        }),
        makeRegularProperty("thread_id", {
          type: "Identifier",
          name: location.getNamespace().getGlobal("PROCESS_ID"),
        }),
        makeRegularProperty("defined_class", {
          type: "Literal",
          value: "TODO"
        }),
        makeRegularProperty("method_id", {
          type: "Literal",
          value: "TODO"
        }),
        makeRegularProperty("path", {
          type: "Literal",
          value: location.getNamespace().getFile().getPath()
        }),
        makeRegularProperty("lineno", {
          type: "Literal",
          value: location.getNamespace().getStartLine()
        }),
        makeRegularProperty("receiver", {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "Identifier",
            name: location.getNamespace().getGlobal("SERIALIZE_PARAMETER")
          },
          arguments: [
            node.type === "ArrowFunctionExpression" ? {
              type: "Identifier",
              name: location.getNamespace().getGlobal("EMPTY_MARKER")
            } : {
              type: "ThisExpression" 
            }, {
              type: "Literal",
              name: "this"
            }
          ]
        }),
        makeRegularProperty("parameters", {
          type: "ArrayExpression",
          elements: node.params.map((node, index) => ({
            type: "CallExpression",
            optional: false,
            callee: {
              type: "Identifier",
              name: location.getNamespace().getGlobal("SERIALIZE_PARAMETER")
            },
            arguments: [{
              type: "Identifier",
              name: location.getNamespace().getLocal("ARGUMENT") + String(index)
            }, {
              type: "Literal",
              name: location.getFile().getContent().substring(node.start, node.end)
            }]
          }))
        }),
        makeRegularProperty("static", {
          type: "Literal",
          value: "TODO"
        })
      ]
    }]
  }
});

const makeLeaveStatement = (node, location) => ({
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    optional: false,
    callee: {
      type: "Identifier",
      name: location.getNamespace().getGlobal("ADD_EVENT")
    },
    arguments: [{
      type: "ObjectExpression",
      properties: [
        makeRegularProperty("id", {
          type: "UpdateExpression",
          prefix: true,
          operator: "++",
          argument: {
            type: "Identifier",
            name: location.getNamespace().getGlobal("EVENT_COUNTER")
          }
        }),
        makeRegularProperty("event", {
          type: "Literal",
          value: "return"
        }),
        makeRegularProperty("thread_id", {
          type: "name",
          value: location.getNamespace().getGlobal("PROCESS_ID")
        }),
        makeRegularProperty("parent_id", {
          type: "name",
          value: location.getNamespace().getGlobal("EVENT_IDENTITY")
        }),
        makeRegularProperty("ellapsed", {
          type: "BinaryExpression",
          operator: "-",
          left: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "Identifier",
              name: location.getNamespace().getGlobal("GET_NOW")
            },
            arguments: []
          },
          right: {
            type: "Identifier",
            name: location.getNamespace().getLocal("TIMER")
          }
        })
      ]
    }]
  }
});

const makeFailureStatement = (node, location) => ({
  type: "ThrowStatement",
  argument: {
    type: "AssignmentExpression",
    operator: "=",
    left: location.getNamespace().getLocal("FAILURE"),
    right: location.getNamespace().getLocal("ERROR")
  }
});

const makeInitializeStatement = (node, location) => ({
  type: "VariableDeclaration",
  kind: "var",
  declarations: nodes.map((node, index) => ({
    type: "VariableDeclarator",
    id: node,
    init: {
      type: "Identifier",
      name: location.getNamespace().getLocal("ARGUMENT") + String(index)
    }
  }));
});

export const visitClosure = (node, location1, context) => {
  if (node.type !== "ArrowFunctionExpression" && node.type !== "FunctionExpression" && node.type !== "FunctionDeclaration") {
    logger.error(`Invalid closure node, got: ${node.type}`);
    return {
      node: Dummy.getFunctionExpressionNode(),
      entities: []
    };
  }
  const location2 = location1.makeDeeperLocation(node, context);
  if (!location2.shouldBeInstrumented()) {
    return {
      node,
      entities: []
    };
  }
  const pairs1 = node.params.map((node) => visitPattern(node, location2);
  let pairs2;
  if (node.type === "ArrowFunctionExpression" && node.expression) {
    pairs2 = [visitReturnStatement({
      type: "ReturnStatement",
      argument: node.body
    }, location2, Context.getVoidContext())];
  } else if (node.type === "BlockStatement") {
    pairs2 = node.body.body.map((node) => visitStatement(node, location2));
  } else {
    logger.error(`Invalid closure block type, got: ${node.type}`);
    pairs2 = [];
  }
  return {
    node: {
      type: node.type,
      async: node.async,
      generator: node.generator,
      params: node.params.map((node, index) => {
        const common = {
          type: "Identifier",
          name: namespace.getLocal("ARGUMENT") + String(index)
        };
        return (
          node.type === "RestElement" ?
          {
            type: "RestElement",
            argument: common} :
          common);
      }),
      body: {
        type: "BlockStatement",
        body: [
          makeSetupStatement(node, location),
          makeEnterStatement(node, location),
          {
            type: "TryStatement",
            block: {
              type: "BlockStatement",
              body: [
                makeInitializeStatement(node, location),
                ...pairs2.map(getNode)
              ]
            },
            handler: {
              type: "CatchClause",
              param: {
                type: "Identifier",
                name: namespace.getLocal("ERROR")
              },
              body: {
                type: "BlockStatement",
                body: [makeFailureStatement(node, location)]
              }
            },
            finalizer: {
              type: "BlockStatement",
              body: [makeLeaveStatement(node, location)]
            }
          }
        ]
      }
    },
    entities: [location2.makeEntity(...pairs1.flatMap(getEntities), ...pairs2.flatMap(getEntities)]
  };
};
