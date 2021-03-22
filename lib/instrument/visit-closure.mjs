
import makeVisit from "./make-visit.mjs";
import {visitName} from "./visit-name.mjs";
import {visitExpression} from  "./visit-expression.mjs";
import {visitBlockStatement} from "./visit-statement.mjs";
import {visitPattern} from "./visit-pattern.mjs";

const getEntities = ({entities}) => entities;
const empty = {
  node: null,
  entities: []
};

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
    name
  },
  init: node
});

/////////////
// Success //
/////////////

const returnStatementVisitor = (node, location) => {
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
    pair = visitExpression(node.argument, location);
  }
  return {
    node: {
      type: "ReturnStatement",
      argument: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: location.getNamespace().getLocal("SUCCESS")
        },
        right: pair.node
      },
    },
    entities: pair.entities
  };
};

export const getReturnStatementVisitor = () => returnStatementVisitor;

// let
//   APPMAP_LOCAL_TIMER = APPMAP_GLOBAL_GET_NOW();
//   APPMAP_LOCAL_EVENT_IDENTITY = ++APPMAP_GLOBAL_EVENT_COUNTER,
//   APPMAP_LOCAL_SUCCESS = APPMAP_GLOBAL_EMPTY_MARKER,
//   APPMAP_LOCAL_FAILURE = APPMAP_GLOBAL_EMPTY_MARKER;
const makeSetupStatement = (node, location) => ({
  type: "VariableDeclaration",
  kind: location.getFile().getLanguageVersion() < 2015 ? "var" : "let",
  declarations: [
    makeRegularVariableDeclarator(location.getNamespace().getLocal("TIMER"), {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: location.getNamespace().getGlobal("GET_NOW")
      },
      arguments: []
    }),
    makeRegularVariableDeclarator(location.getNamespace().getLocal("EVENT_IDENTITY"), {
      type: "UpdateExpression",
      prefix: true,
      operator: "++",
      argument: {
        type: "Identifier",
        name: location.getNamespace().getGlobal("EVENT_COUNTER")
      }
    }),
    makeRegularVariableDeclarator(location.getNamespace().getLocal("SUCCESS"), {
      type: "Identifier",
      name: location.getNamespace().getGlobal("EMPTY_MARKER")
    }),
    makeRegularVariableDeclarator(location.getNamespace().getLocal("FAILURE"), {
      type: "Identifier",
      name: location.getNamespace().getGlobal("EMPTY_MARKER")
    })
  ]
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
          elements: node.params.map((child, index) => ({
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
              name: location.getFile().getContent().substring(child.start, child.end)
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
  declarations: node.params.map((child, index) => ({
    type: "VariableDeclarator",
    id: child,
    init: {
      type: "Identifier",
      name: location.getNamespace().getLocal("ARGUMENT") + String(index)
    }
  }))
});

const common = (node, location) => {
  // console.assert(node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression" || node.type === "FunctionDeclaration");
  let pair1 = empty;
  if (node.type !== "ArrowFunctionExpression" && node.id !== null) {
    pair1 = visitName(node.id, location);
  }
  const pairs = node.params.map((child) => visitPattern(child, location));
  let pair2;
  if (node.type === "ArrowFunctionExpression" && node.expression) {
    pair2 = returnStatementVisitor({
      type: "ReturnStatement",
      argument: node.body
    }, location);
  } else {
    pair2 = node.body.body.map((child) => visitBlockStatement(child, location));
  }
  return {
    node: {
      type: node.type,
      id: pair1.node,
      async: node.async,
      generator: node.generator,
      params: node.params.map((child, index) => {
        let result = {
          type: "Identifier",
          name: location.getNamespace().getLocal("ARGUMENT") + String(index)
        };
        if (child.type === "RestElement") {
          result = {
            type: "RestElement",
            argument: result
          };
        }
        return result;
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
                ...(pair2.node.type === "BlockStatement" ? pair2.node.body : [pair2.node])
              ]
            },
            handler: {
              type: "CatchClause",
              param: {
                type: "Identifier",
                name: location.getNamespace().getLocal("ERROR")
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
    entities: [location.makeEntity(...pair1.entities, ...pairs.flatMap(getEntities), ...pair2.entities)]
  };
};

export const getArrowFunctionExpressionVisitor = () => common;

export const getFunctionExpressionVisitor = () => common;

export const getFunctionDeclarationVisitor = () => common;

export const visitFunctionExpression = makeVisit("FunctionExpression", {
  __proto__: null,
  FunctionExpression: common
});
