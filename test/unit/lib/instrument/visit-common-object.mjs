import {
  parse,
  mockResult,
  compareResult,
  mockRootLocation,
} from './__fixture__.mjs';
import {
  assignVisitorObject,
  visit,
} from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-common-object.mjs';

Error.stackTraceLimit = Infinity;

{
  const makeVisitor = (kind) => (node, location) =>
    mockResult(
      parse('Expression', JSON.stringify(`${kind}|${node.value}`)),
      [],
    );
  assignVisitorObject('Expression', {
    Literal: makeVisitor('Expression'),
  });
  assignVisitorObject('NonComputedKey', {
    Literal: makeVisitor('NonComputedKey'),
  });
}

assignVisitorObject('Method', {
  FunctionExpression: (node, location) =>
    mockResult(parse('Expression', `function (visited) {}`), []),
});

const namespace = null;
const location = mockRootLocation(namespace);

compareResult(
  visit('Expression', parse('Expression', `{["foo"]:"bar"}`), location),
  mockResult(parse('Expression', `{["Expression|foo"]:"Expression|bar"}`), [
    {
      kind: 'Expression',
      type: 'ObjectExpression',
      line: 1,
      childeren: [],
    },
  ]),
);

compareResult(
  visit('Expression', parse('Expression', `{"foo" (bar) {}}`), location),
  mockResult(parse('Expression', `{"NonComputedKey|foo" (visited) {} }`), [
    {
      kind: 'Expression',
      type: 'ObjectExpression',
      line: 1,
      childeren: [],
    },
  ]),
);
