import {
  parseExpression,
  mockResult,
  compareResult,
  mockRootLocation,
} from './__fixture__.mjs';
import {
  assignVisitorObject,
  visitExpression,
} from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-common-object.mjs';

Error.stackTraceLimit = Infinity;

{
  const makeVisitor = (kind) => (node, location) =>
    mockResult(parseExpression(JSON.stringify(`${kind}|${node.value}`)), []);
  assignVisitorObject('Expression', {
    Literal: makeVisitor('Expression'),
  });
  assignVisitorObject('NonComputedKey', {
    Literal: makeVisitor('NonComputedKey'),
  });
}

assignVisitorObject('Method', {
  FunctionExpression: (node, location) =>
    mockResult(parseExpression(`function (visited) {}`), []),
});

const namespace = null;
const location = mockRootLocation(namespace);

compareResult(
  visitExpression(parseExpression(`{["foo"]:"bar"}`), location),
  mockResult(parseExpression(`{["Expression|foo"]:"Expression|bar"}`), [
    {
      kind: 'Expression',
      type: 'ObjectExpression',
      line: 1,
      childeren: [],
    },
  ]),
);

compareResult(
  visitExpression(parseExpression(`{"foo" (bar) {}}`), location),
  mockResult(parseExpression(`{"NonComputedKey|foo" (visited) {} }`), [
    {
      kind: 'Expression',
      type: 'ObjectExpression',
      line: 1,
      childeren: [],
    },
  ]),
);
