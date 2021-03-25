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
import '../../../../lib/instrument/visit-common-class.mjs';

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

assignVisitorObject('ScopingIdentifier', {
  Identifier: (node, location) => mockResult(
    parse('Expression', `ScopingIdentifier_${node.name}`),
    [])
});

assignVisitorObject('Method', {
  FunctionExpression: (node, location) =>
    mockResult(parse('Expression', `function () { "Method"; }`), []),
});

const namespace = null;
const location = mockRootLocation(namespace);

compareResult(
  visit('Expression', parse('Expression', `class { ["m"] () {} }`), location),
  mockResult(parse('Expression', `class { ["Expression|m"] () { "Method"; } }`), [
    {
      kind: 'Expression',
      type: 'ClassExpression',
      line: 1,
      childeren: [],
    },
  ]),
);

compareResult(
  visit(
    'Statement',
    parse('Statement', `class c extends "super" { static get "m" () {} }`),
    location,
  ),
  mockResult(
    parse(
      'Statement',
      `class ScopingIdentifier_c extends "Expression|super" { static get "NonComputedKey|m" () { "Method"; } }`,
    ),
    [
      {
        kind: 'Statement',
        type: 'ClassDeclaration',
        line: 1,
        childeren: [],
      },
    ],
  ),
);
