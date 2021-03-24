import { strict as Assert } from 'assert';
import {
  parseExpression,
  parseSpreadableExpression,
  generate,
  mockRootLocation,
} from './fixture.mjs';
import {
  getResultNode,
  getResultEntities,
} from '../../../../lib/instrument/result.mjs';
import * as Visit from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-common-other.mjs';

let counter = 0;

const namespace = {
  checkCollision(...args) {
    counter += 1;
    Assert.deepEqual(this, namespace);
    Assert.deepEqual(args, ['scoping']);
  },
};

const location = mockRootLocation(namespace);

const test = (kind, node) => {
  const result = Visit[`visit${kind}`](node, location);
  Assert.equal(generate(getResultNode(result)), generate(node));
  Assert.deepEqual(getResultEntities(result), []);
};

/////////////
// Literal //
/////////////

['Literal', 'NonComputedKey', 'Expression'].forEach((kind) => {
  test(kind, parseExpression(`123`));
  test(kind, parseExpression(`123n`));
  test(kind, parseExpression(`/abc/g`));
});

///////////////////
// SpreadElement //
///////////////////

['SpreadableExpression', 'Property'].forEach((kind) => {
  test(kind, parseSpreadableExpression(`...123`));
});

////////////////
// Identifier //
////////////////

Assert.equal(counter, 0);

[
  ['NonScopingIdentifier', 'nonScoping'],
  ['NonComputedKey', 'nonScoping'],
  ['ScopingIdentifier', 'scoping'],
  ['Expression', 'scoping'],
  ['Pattern', 'scoping'],
  ['RestablePattern', 'scoping'],
].forEach(([kind, name]) => test(kind, parseExpression(name)));

Assert.equal(counter, 4);
