import { assert } from "../../../util/index.mjs";

const tags = new Map([
  ["ObjectExpression", "object"],
  ["ArrowFunctionExpression", "arrow"],
  ["FunctionExpression", "function"],
  ["FunctionDeclaration", "function"],
  ["ClassExpression", "class"],
  ["ClassDeclaration", "class"],
]);

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

export const makeDesignator = (node, list, counter) => {
  const tag = tags.get(node.type);
  if (tag === undefined) {
    return null;
  }
  const index = counter.increment();
  let name = null;
  let bound = false;
  if (
    list.head.type === "Property" &&
    list.head.value === list.head &&
    list.tail.head.type === "ObjectExpression"
  ) {
    bound = true;
    name = "";
    if (list.head.kind !== "init") {
      name = `${name}${list.head.kind} `;
    }
    name = `${name}${computeKeyName(list.head)}`;
  } else if (
    list.head.type === "MethodDefinition" &&
    list.head.value === list.head &&
    list.tail.head.type === "ClassBody"
  ) {
    bound = true;
    if (list.head.kind === "constructor") {
      name = "constructor";
    } else {
      name = computeKeyName(list.head);
      if (list.head.kind !== "method") {
        name = `${list.head.kind} ${name}`;
      }
    }
  } else if (
    node.type === "FunctionDeclaration" ||
    node.type === "ClassDeclaration"
  ) {
    name = node.id === null ? "default" : node.id.name;
  } else if (
    (node.type === "FunctionExpression" || node.type === "ClassExpression") &&
    node.id !== null
  ) {
    name = node.id.name;
  } else if (
    list.head.type === "AssignmentExpression" &&
    list.head.right === node &&
    list.head.operator === "=" &&
    list.head.left.type === "Identifier"
  ) {
    name = list.head.left.name;
  } else if (
    list.head.type === "VariableDeclarator" &&
    list.head.init === node &&
    list.head.id.type === "Identifier"
  ) {
    name = list.head.id.name;
  } else {
    name = `${tag}-${String(index)}`;
  }
  return { name, index, bound };
};
