import { strict as Assert } from 'assert';
import {
  parseExpression,
  parseSpreadableExpression,
  compareResult,
  mockResult,
  mockRootLocation,
} from './__fixture__.mjs';
import * as Visit from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-common-other.mjs';

let counter = 0;

const namespace = {
  __proto__: null,
  checkCollision(...args) {
    counter += 1;
    Assert.deepEqual(this, namespace);
    Assert.deepEqual(args, ['scoping']);
  },
};

const location = mockRootLocation(namespace);

const test = (kind, node) => compareResult(
  Visit[`visit${kind}`](
    node,
    location),
  mockResult(
    node,
    []));

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
