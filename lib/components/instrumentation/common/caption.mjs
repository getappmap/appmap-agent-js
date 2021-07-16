
export const default ({Util:{assert}}) => {
  const computeKeyName = (node) => {
    assert(
      node.type === "Property" || node.type === "MethodDefinition",
      "invalid node type %o",
      node.type,
    );
    if (node.computed) {
      return "[#computed]";
    }
    if (node.key.type === "Identifier") {
      return node.key.name;
    }
    assert(node.key.type === "Literal", "invalid non-computed key node");
    assert(
      typeof node.key.value === "string",
      "invalid non-computed key literal node",
    );
    return JSON.stringify(node.key.value);
  };
  return {
    makeCaption: (origin, name) => ({
      origin,
      name,
    }),
    captionize: ({head:node, tail:{head:parent, tail}}) => {
      if (
        parent.type === "Property" &&
        parent.value === node &&
        getNodeParent(parent).type === "ObjectExpression"
      ) {
        let name = computeKeyName(parent);
        if (parent.kind !== "init") {
          name = `${parent.kind} ${name}`;
        }
        return makeCaption("Property", name);
      }
      if (
        parent.type === "MethodDefinition" &&
        parent.value === node &&
        getNodeParent(parent).type === "ClassBody"
      ) {
        let name = computeKeyName(parent);
        if (parent.kind !== "method" && parent.kind !== "constructor") {
          name = `${parent.kind} ${name}`;
        }
        return makeCaption("MethodDefinition", name);
      }
      if (
        parent.type === "AssignmentExpression" &&
        parent.right === node &&
        parent.operator === "=" &&
        parent.left.type === "Identifier"
      ) {
        return makeCaption("AssignmentExpression", parent.left.name);
      }
      if (
        parent.type === "VariableDeclarator" &&
        parent.init === node &&
        parent.id.type === "Identifier"
      ) {
        return makeCaption("VariableDeclarator", parent.id.name);
      }
      return makeCaption(node.type, null);
    },
  };
};
