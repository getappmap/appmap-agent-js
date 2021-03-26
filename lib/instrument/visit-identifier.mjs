import { setVisitor, getEmptyArray } from './visit.mjs';

setVisitor("Identifier", getEmptyArray, (node, context) => {
  if (context.location.isScopingIdentifier()) {
    context.namespace.checkCollision(node.name);
  }
  return {
    type: "Identifier",
    name: node.name
  };
});

