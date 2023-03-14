"use strict";
const Assert = require("node:assert");

const {
  strict: { equal: assertEqual },
} = Assert;

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
        const { options: globals } = context;
        return {
          Identifier: (node) => {
            if (globals.includes(node.name)) {
              if (
                node.parent.type === "VariableDeclarator" &&
                node.parent.init === node
              ) {
                assertEqual(node.parent.parent.type, "VariableDeclaration");
                if (
                  node.parent.parent.parent.type === "ExportNamedDeclaration" &&
                  node.parent.parent.parent.declaration === node.parent.parent
                ) {
                  return undefined;
                } else if (node.parent.parent.parent.type === "Program") {
                  return undefined;
                } else {
                  return context.report({
                    node,
                    message:
                      "Global declaration should only appear at the top level",
                  });
                }
              } else {
                return context.report({
                  node,
                  message:
                    "Global object can only be used in variable declaration",
                });
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
        const { options: allowed } = context;
        const reportReference = (reference) => {
          const { identifier } = reference;
          const { name } = identifier;
          if (!allowed.includes(name)) {
            context.report({
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
            const { variables, through } = context.getScope();
            variables.filter(isVariableNotDefined).forEach(reportVariable);
            // Duplicate with no-undef
            // through.forEach(reportReference);
          },
        };
      },
    },
  },
};
