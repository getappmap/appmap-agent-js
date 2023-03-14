"use strict";
const Assert = require("node:assert");

const {
  strict: { equal: assertEqual, notEqual: assertNotEqual },
} = Assert;

const isTopLevelDeclaration = (node) =>
  node.parent.parent.parent.type === "Program" ||
  (node.parent.parent.parent.type === "ExportNamedDeclaration" &&
    node.parent.parent.parent.declaration === node.parent.parent &&
    node.parent.parent.parent.parent.type === "Program");

module.exports = {
  rules: {
    "global-object-access": {
      meta: {
        type: "suggestion",
        docs: {
          description: "constraint access to the global object",
          recommended: false,
        },
        schema: {
          type: "array",
          items: { type: "string" },
        },
      },
      create: (context) => {
        const { options: globals, getScope, report } = context;
        return {
          Identifier: (node) => {
            if (globals.includes(node.name)) {
              if (
                node.parent.type !== "VariableDeclarator" ||
                node.parent.init !== node
              ) {
                return report({
                  node,
                  message:
                    "Global object can only be used in variable declaration",
                });
              }
              assertEqual(
                node.parent.parent.type,
                "VariableDeclaration",
                "invalid parent of VariableDeclarator",
              );
              if (!isTopLevelDeclaration(node)) {
                return report({
                  node: node.parent.parent,
                  message:
                    "Global declaration should only appear at the top level",
                });
              }
              if (node.parent.id.type !== "ObjectPattern") {
                return report({
                  node: node.parent.id,
                  message: "Global declaration should be an object pattern",
                });
              }
              let scope = getScope();
              while (scope !== null && scope.type !== "global") {
                scope = scope.upper;
              }
              assertNotEqual(scope, null, "missing global scope");
              for (const property of node.parent.id.properties) {
                if (property.type === "RestElement") {
                  report({
                    node: property,
                    message: "Global declaration should not use rest pattern",
                  });
                } else {
                  assertEqual(
                    property.type,
                    "Property",
                    "invalid property type",
                  );
                  if (property.computed) {
                    report({
                      node: property,
                      message:
                        "Global declaration should not use computed property",
                    });
                  } else if (!scope.set.has(property.key.name)) {
                    report({
                      node: property.key,
                      message: `Undefined global variable ${property.key.name}`,
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
    "no-globals": {
      meta: {
        type: "suggestion",
        docs: {
          description: "disallow global variables",
          recommended: false,
        },
        schema: {
          type: "array",
          items: { type: "string" },
        },
      },
      create: (context) => {
        const { options: allowed, report, getScope } = context;
        const reportReference = (reference) => {
          const { identifier } = reference;
          const { name } = identifier;
          if (!allowed.includes(name)) {
            report({
              node: identifier,
              message: `Forbidden global variable: ${name}`,
            });
          }
        };
        const reportVariable = ({ references }) => {
          references.forEach(reportReference);
        };
        const isVariableNotDefined = ({ references: { length } }) => length > 0;
        return {
          Program: () => {
            const { variables, through } = getScope();
            variables.filter(isVariableNotDefined).forEach(reportVariable);
            // Duplicate with no-undef
            // through.forEach(reportReference);
          },
        };
      },
    },
  },
};
