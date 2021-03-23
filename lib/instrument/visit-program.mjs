import { assignVisitorObject, visitStatement } from './visit.mjs';
import { combineResult } from './result.mjs';

const makeProgram = (node, childeren) => ({
  type: 'Program',
  sourceType: node.sourceType,
  body: childeren,
});

assignVisitorObject('Program', {
  Program: (node, location) =>
    combineResult(
      makeProgram,
      node,
      node.body.map((child) => visitStatement(child, location)),
    ),
});
