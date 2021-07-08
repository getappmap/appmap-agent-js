import { getNodeIndex, getNodeCaption, getNodeParent } from "./node.mjs";
import * as Escodegen from "escodegen";

export const createFunctionEntity = (node, children) => ({
  type: "function",
  static:
    node.type !== "ArrowFunctionExpression" &&
    getNodeParent(node).type === "MethodDefinition" &&
    getNodeParent(node).value === node &&
    getNodeParent(node).static,
  params: node.params.map(Escodegen.generate),
  caption: getNodeCaption(node),
  index: getNodeIndex(node),
  children,
  span: [node.start, node.end],
  loc: node.loc,
});

export const createClassEntity = (node, children) => ({
  type: "class",
  caption: getNodeCaption(node),
  index: getNodeIndex(node),
  children,
});
