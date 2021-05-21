import { setVisitor, visit } from './visit.mjs';

setVisitor(
  'Program',
  (node, context) => [node.body.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: 'Program',
    sourceType: node.sourceType,
    body: children,
  }),
);
