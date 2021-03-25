import { strict as Assert } from 'assert';
import {
  mockResult,
  mockRootLocation,
  parseExpression,
  generate,
} from './__fixture__.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import {
  getResultEntities,
  getResultNode,
} from '../../../../lib/instrument/result.mjs';
import {
  assignVisitorObject,
  visitExpression,
} from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-common-object.mjs';

Error.stackTraceLimit = Infinity;

{
  const makeVisitor = (kind) => (node, location) =>
    mockResult(
      {
        type: 'Literal',
        value: `${kind}|${node.value}`,
      },
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
    mockResult(
      {
        type: 'FunctionExpression',
        id: null,
        async: false,
        generator: false,
        params: [],
        body: {
          type: 'BlockStatement',
          body: [],
        },
      },
      [],
    ),
});

const location = mockRootLocation(new Namespace('PREFIX'));

{
  const node1 = parseExpression(`class c { }`);
  const code1 = generate(node1);
  const node2 = parseExpression(`{["Expression|foo"]:"Expression|bar"}`);
  const code2 = generate(node2);
  const result = visitExpression(node1, location);
  Assert.deepEqual(generate(getResultNode(result)), code2);
  Assert.deepEqual(getResultEntities(result), [
    {
      kind: 'Expression',
      code: code1,
      childeren: [],
    },
  ]);
}

{
  const node1 = parseExpression(`{"foo" (bar) { qux; }}`);
  const code1 = generate(node1);
  const node2 = parseExpression(`{"NonComputedKey|foo" () {} }`);
  const code2 = generate(node2);
  const result = visitExpression(node1, location);
  Assert.deepEqual(generate(getResultNode(result)), code2);
  Assert.deepEqual(getResultEntities(result), [
    {
      kind: 'Expression',
      code: code1,
      childeren: [],
    },
  ]);
}
