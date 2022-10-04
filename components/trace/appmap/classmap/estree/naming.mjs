const { URL, Map, String } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { incrementCounter } = await import(
  `../../../../util/index.mjs${__search}`
);

const tags = new Map([
  ["ArrowFunctionExpression", "arrow"],
  ["FunctionExpression", "function"],
  ["FunctionDeclaration", "function"],
  ["ObjectExpression", "object"],
  ["ClassExpression", "class"],
  ["ClassDeclaration", "class"],
]);

const getAnonymousName = ({ separator, counter }, { type }) =>
  `${tags.has(type) ? tags.get(type) : "unknown"}${separator}${String(
    incrementCounter(counter),
  )}`;

export const getName = (naming, node, parent) => {
  if (
    (parent.type === "Property" || parent.type === "MethodDefinition") &&
    parent.value === node
  ) {
    return !parent.computed && parent.key.type === "Identifier"
      ? parent.key.name
      : getAnonymousName(naming, node);
  }
  if (node.type === "FunctionExpression" && node.id !== null) {
    return node.id.name;
  }
  if (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") {
    return node.id === null ? "default" : node.id.name;
  }
  if (
    parent.type === "AssignmentExpression" &&
    parent.right === node &&
    parent.operator === "=" &&
    parent.left.type === "Identifier"
  ) {
    return parent.left.name;
  }
  if (
    parent.type === "VariableDeclarator" &&
    parent.init === node &&
    parent.id.type === "Identifier"
  ) {
    return parent.id.name;
  }
  return getAnonymousName(naming, node);
};
