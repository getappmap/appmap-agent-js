import { assignVisitorObject, visitStatement } from './visit.mjs';
import { combineResult } from './result.mjs';

const makeProgram = (node, location, childeren) => ({
  type: 'Program',
  sourceType: node.sourceType,
  body: childeren,
});

assignVisitorObject('Program', {
  Program: (node, location) =>
    combineResult(
      makeProgram,
      node,
      location,
      node.body.map((child) => visit("Statement", child, location)),
    ),
});
