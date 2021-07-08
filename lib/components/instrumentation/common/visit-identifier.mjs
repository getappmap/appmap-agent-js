import { expect } from "../../../util/index.mjs";
import { getNodeParent } from "./node.mjs";
import { setSimpleVisitor } from "./visit.mjs";

const empty = [];

const isNonScopingIdentifier = (node) => {
  const parent = getNodeParent(node);
  if (
    parent.type === "BreakStatement" ||
    parent.type === "ContinueStatement" ||
    parent.type === "LabeledStatement"
  ) {
    return parent.label === node;
  }
  if (parent.type === "ExportSpecifier") {
    return parent.exported === node;
  }
  if (parent.type === "ImportSpecifier") {
    return parent.imported === node;
  }
  if (parent.type === "MemberExpression") {
    return parent.property === node && !parent.computed;
  }
  if (parent.type === "MethodDefinition" || parent.type === "Property") {
    return parent.key === node && !node.computed;
  }
  return false;
};

setSimpleVisitor(
  "Identifier",
  (node, context) => {
    expect(
      !node.name.startsWith(context.runtime) || isNonScopingIdentifier(node),
      "identifier collision detected at %s@%j-%j; %j should not start with %j",
      context.path,
      node.loc.start.line,
      node.loc.start.column,
      node.name,
      context.runtime,
    );
    return empty;
  },
  (node, context) => ({
    type: "Identifier",
    name: node.name,
  }),
);
