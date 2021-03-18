
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

const makeRegularDeclarator = (name, node) => ({
  type: "VariableDeclaration",
  id: {
    type: "Identifier",
    name: name
  },
  init: node
});

const getLastFunctionLocation = (locations) => {
  for (let index = locations.length - 1; index >= 0; index--) {
    if (locations[index].isClass()) {
      return locations[index];
    }
  }
  throw new Error(``);
}

const getLastClassLocation = (locations) => {
  for (let index = locations.length - 1; index >= 0; index--) {
    if (locations[index].isFunction()) {
      return locations[index];
    }
  }
};

const serialize = () => {
  const properties = [];
  return {
    type: "ObjectExpression",
    properties: [
      makeRegularProperty("class", {}),
      makeRegularProperty("object_id", {}),
      makeRegular

    ]
  };
};

// const extractName = (file, node) => {
//   if (node.type === "Identifier") {
//     return node.name;
//   }
//   if (node.type === "AssignmentExpression") {
//     return extractName(node.left);
//   }
//   return "<pattern>";
// };


const closure = (locations, context) => {
  const location1 = getLastFunctionLocation(locations);
  const location2 = getLastClassLocation(locations);
  // var
  //   appmap_local_id = ++appmap_global_id,
  //   appmap_local_success = appmap_global_marker,
  //   appmap_local_failure = appmap_global_marker,
  //   appmap_local_arguments = [],
  //   appmap_local_timer = appmap_global_now();
  const statement1 = {
    type: "VariableDeclaration",
    kind: "var",
    declarations: [
      makeRegularDeclarator(namespace.getLocalId(), {
        type: "UpdateExpression",
        prefix: true,
        argument: {
          type: "Identifier",
          name: namespace.global_id
        }
      }),
      makeRegularDeclarator(namespace.getLocalSuccess(), {
        type: "Identifier",
        name: namespace.getGlobalMarker()
      }),
      makeRegularDeclarator(namespace.getLocalFailure(), {
        type: "Identifier",
        name: namespace.getGlobalMarker()
      }),
      makeRegularDeclarator(namespace.getLocalSerializedArguments(), {
        type: "ArrayExpression",
        elements: node.params.map((node, index) => ({
          type: "ObjectExpression",

        }))
      }),
      makeRegularDeclarator(namespace.getLocalTimer(), {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: namespace.getGlobalNow()
        },
        arguments: []
      })
    ]
  };
  const statement2 = {
    type: "ForStatement",
    init: {
      type: "VariableDeclaration",
      declarations: [makeRegularDeclarator(namespace.getLocalIndex(), {
        type: "Literal",
        value: 0
      })
    },
    test: {
      type: "BinaryExpression",
      operator: "<",
      left: {
        type: "Identifier",
        name: namespace.getLocalIndex()
      },
      right: {
        type: "MemberExpression",
        computed: false,
        optional: false,
        object: {
          type: "Identifier",
          name: node.type === "ArrowFunctionExpression" ? namespace.getLocalArguments() : "arguments"
        },
        property: {
          type: "Literal",
          value: "length"
        }
      }
    },
    update: {
      type: "UpdateExpression",
      operator: "++",
      argument: {
        type: "Identifier",
        name: namespace.getLocalIndex()
      }
    },
    body: {
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: {
            type: "Identifier",
            name: namespace.getLocalSerializedArguments()
          },
          property: {
            type: "Identifier",
            name: namespace.getLocalIndex()
          }
        },
        right: {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "Identifier",
            name: namespace.getGlobalSerialize()
          },
          arguments: {

          }
        }
      }

  };


  const statement2 = {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: namespace.getGlobalRegisterEvent()
      },
      arguments: [{
        type: "ObjectExpression",
        properties: [
          makeRegularProperty("id", {
            type: "identifier",
            name: namespace.getLocalCounter(),
          }),
          makeRegularProperty("event", {
            type: "Literal",
            value: "call"
          }),
          makeRegularProperty("thread_id", {
            type: "Identifier",
            name: namespace.getGlobalThreadID(),
          }),
          makeRegularProperty("defined_class", {
            type: "Literal",
            value: location2.getName()
          }),
          makeRegularProperty("method_id", {
            type: "Literal",
            value: location1.getName()
          }),
          makeRegularProperty("path", {
            type: "Literal",
            value: location1.getPath()
          }),
          makeRegularProperty("lineno", {
            type: "Literal",
            value: location1.getStartLineNumber()
          }),
          makeRegularProperty("receiver", {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: namespace.jsonify
            },
          }),
          makeRegularProperty("parameters", {
            type: "ArrayExpression",
            elements: []
          }),
          makeRegularProperty("static", {
            type: "Literal",
            value: locations[locations.length - 1].isStatic()
          })
        ]
      }]
    }
  };
  let statement3;
  if (node.type === "ArrowFunctionExpression" && node.expression) {
    statement3 = {
      type: "TryStatement",
      block: {
        type: "BlockStatement",
        body: [{
          type: "ReturnStatement",
          expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "Identifier",
              name: namespace.getLocalReturn()
            },
            right: visitExpression(node.body, context, Naming.getVoidNaming())
          }
        }]
      },
      catch: {
        type: "CatchClause",
        param: {
          type: "Identifier",
          name: namespace.getLocalError()
        },
        body: {
          type: "BlockStatement",
          body: [{
            type: "ExpressionStatement",
            expression: {
              type: "AssignmentExpression",
              operator: "=",
              left: namespace.getLocalFailure(),
              right: namespace.getLocalError()
            }
          }]
        }
      },
      finally: {
        type: "BlockStatement",
        body: [{
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: namespace.getGlobalRegisterEvent()
          },
          arguments: [{
            type: "ObjectExpression",
            properties: [
              makeRegularProperty("id", )
            ]
          }]
        }]
      }





        }
      }
    }
  } else if {

  }

    return ;


  if (node.type === "ArrowFunctionExpression") {
    return {

    }
  }

};
