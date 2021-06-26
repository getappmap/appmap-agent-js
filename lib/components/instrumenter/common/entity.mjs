import { getNodeIndex, getNodeCaption } from "./node.mjs";

export const makeFunctionEntity = (node, _static, children) => ({
  type: "function",
  caption: getNodeCaption(node),
  index: getNodeIndex(node),
  children,
  span: [node.start, node.end],
  loc: node.loc,
  static: _static,
});

export const makeClassEntity = (node, children) => ({
  type: "class",
  caption: getNodeCaption(node),
  index: getNodeIndex(node),
  children,
});
