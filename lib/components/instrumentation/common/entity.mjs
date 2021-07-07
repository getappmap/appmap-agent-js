import { getNodeIndex, getNodeCaption } from "./node.mjs";

export const createFunctionEntity = (node, _static, params, children) => ({
  type: "function",
  static: _static,
  params,
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
