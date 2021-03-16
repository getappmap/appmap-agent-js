
import {visitExpression, visitMemberProperty} from "expression";

export const visitPattern = (node, context, kind) => {
  if (node.type in visitors) {
    return visitors[node.type]
  }
  return visitExpression(node, context);
}

const visitRestablePattern = (node, context, kind) => {
  if (node.type === "RestElement") {
    return {
      type: "RestElement",
      argument: visitPattern(node.argument, context, kind)
    };
  }
  return visitPattern(node, context, kind);
};

const visitProperty = (node, context, kind) => {
  
};

const visitors = {
  __proto__: null,
  Identifier: (node, context, kind) => {
    type: "Identifier",
    name: node.name
  },
  MemberExpression: (node, context, kind) => {
    // TODO
  },
  AssignmentPattern: (node, context, kind) => {
    if (node.left.type === "Identifier" && node.left.) {
      
    }
    type: "AssignmentPattern",
    left: visitPattern(node.left, context, kind),
    right: visitExpression(node.right, context)
  }),
  ArrayPattern: (node, context, kind) => ({
    type: "ArrayExpression",
    elements: node.elements.map((node, index) => {
      if (node === null) {
        return null;
      }
      if (index === node.elements.length - 1) {
        return visitRestablePattern(node, context, kind);
      }
      return visitPattern(node, context, kind);
    })
  }),
  ObjectPattern: (node, context, kind) => ({
    type: "ObjectPattern",
    properties: node.properties.map((node, index) => {
      if (node === node.elements.length - 1)
    });
  })
};
