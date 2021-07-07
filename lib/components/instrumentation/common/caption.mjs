import { assert } from "../../../util/index.mjs";
import { getNodeParent } from "./node.mjs";

export const createCaption = (origin, name) => ({
  origin,
  name,
});

export const computeCaption = (node, index) => {
  const parent = getNodeParent(node);
  if (
    parent.type === "Property" &&
    parent.value === node &&
    getNodeParent(parent).type === "ObjectExpression"
  ) {
    let name = computeKeyName(parent);
    if (parent.kind !== "init") {
      name = `${parent.kind} ${name}`;
    }
    return createCaption("Property", name, index);
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
    return createCaption("MethodDefinition", name, index);
  }
  if (
    parent.type === "AssignmentExpression" &&
    parent.right === node &&
    parent.operator === "=" &&
    parent.left.type === "Identifier"
  ) {
    return createCaption("AssignmentExpression", parent.left.name, index);
  }
  if (
    parent.type === "VariableDeclarator" &&
    parent.init === node &&
    parent.id.type === "Identifier"
  ) {
    return createCaption("VariableDeclarator", parent.id.name, index);
  }
  return createCaption(node.type, null, index);
};

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
