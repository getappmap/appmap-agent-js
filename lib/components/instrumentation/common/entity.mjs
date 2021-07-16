import { getNodeIndex, getNodeCaption, getNodeParent } from "./node.mjs";
import * as Escodegen from "escodegen";

const default = (Util) => {

};

export const makePackageEntity = (source_type, path, code, children) => ({
  type: "package",
  source_type,
  path,
  code,
  children,
});

export const makeClassEntity = (node, children) => ({
  type: "class",
  caption: getNodeCaption(node),
  index: getNodeIndex(node),
  children,
});

export const makeFunctionEntity = (node, children) => ({
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
