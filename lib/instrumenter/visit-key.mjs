
import visitExpression from "./visit-expression.mjs";

export default const visitKey = (node, context, computed) => {
  if (computed) {
    return visitExpression(node, context);
  }
  if (node.type === "Identifier") {
    return {
      type: "Identifier",
      name: node.name
    };
  }
  if (node.type === "Literal" && typeof node.value === "string" && Reflect.getOwnPropertyDescriptor(node, "regex") === undefined) {
    return {
      type: "Literal",
      value: node.value
    };
  }
  logger.error(`Invalid non-computed property-key node`);
  return {
    type: "Identifier",
    name: "__APPMAP_ERROR__"
  };
};