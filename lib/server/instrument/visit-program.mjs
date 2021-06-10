import { setVisitor, visit } from './visit.mjs';

setVisitor(
  'Program',
  (node, location) => [node.body.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'Program',
    sourceType: node.sourceType,
    body: children,
  }),
);
