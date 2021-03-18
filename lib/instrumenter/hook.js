
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


const closure = (locations, context) => {
  const location1 = getLastFunctionLocation(locations);
  const location2 = getLastClassLocation(locations);
  // var
  //   appmap_local_id = ++appmap_global_id,
  //   appmap_local_success = appmap_global_marker,
  //   appmap_local_failure = appmap_global_marker,
  //   appmap_local_timer = appmap_global_now(),
  //   appmap_local_arguments =
  const statement1 = {
    type: "VariableDeclaration",
    kind: "var",
    declarations: [{
      type: "VariableDeclaration",
      id: {
        type: "Identifier",
        name: namespace.local_id
      },
      init: {
        type: "UpdateExpression",
        prefix: true,
        argument: {
          type: "Identifier",
          name: namespace.global_id
        }
      }
    }, {
      type: "VariableDeclaration",
      id: {
        type: "Identifier",
        name: namespace.local_return
      },
      init: {
        type: "Identifier",
        name: namespace.global_undefined_return
      }
    }, {
      type: "VariableDeclaration",
      id: {
        type: "Identifier",
        name: namespace.global_local_timer
      },
      init: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: namespace.global_now
        }
      }
    }]
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
