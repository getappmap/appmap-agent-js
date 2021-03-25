import {
  parse,
  mockResult,
  compareResult,
  mockRootLocation,
} from './__fixture__.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import {
  assignVisitorObject,
  visit,
} from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-common-closure.mjs';

Error.stackTraceLimit = Infinity;

[
  'Expression',
  'Pattern',
  'RestablePattern',
  'ScopingIdentifier',
  'NonScopingIdentifier',
].forEach((kind) => {
  assignVisitorObject(kind, {
    Identifier: (node, location) =>
      mockResult(parse('Expression', `${kind}_${node.name}`), []),
  });
});

const namespace = new Namespace("PREFIX");
const location = mockRootLocation(namespace);

compareResult(
  visit('Expression', parse('Expression', `(x, y) => r`), location),
  mockResult(parse('Expression', `() => {}`), [
    {
      kind: 'Expression',
      type: 'ClassExpression',
      line: 1,
      childeren: [],
    },
  ]),
);
