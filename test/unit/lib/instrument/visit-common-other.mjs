import { strict as Assert } from 'assert';
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

const location = {
  extend(node, kind) {
    return this;
  },
  shouldBeInstrumented() {
    return true;
  },
  getNamespace() {
    Assert.deepEqual(this, location);
    return namespace;
  },
};

const test = (kind, node) => {
  Assert.deepEqual(Visit[`visit${kind}`](node, location), {
    node,
    entities: [],
  });
};

/////////////
// Literal //
/////////////

{
  const node = {
    type: 'Literal',
    value: 123,
  };
  ['Literal', 'NonComputedKey', 'Expression'].forEach((kind) => {
    test(kind, node);
  });
}

test('Literal', {
  type: 'Literal',
  bigint: '123n',
  value: 123n,
});

test('Literal', {
  type: 'Literal',
  regex: {
    pattern: 'abc',
    flags: 'g',
  },
  value: /abc/g,
});

///////////////////
// SpreadElement //
///////////////////

test('SpreadableExpression', {
  type: 'SpreadElement',
  argument: {
    type: 'Literal',
    value: 123,
  },
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
].forEach(([kind, name]) =>
  test(kind, {
    type: 'Identifier',
    name,
  }),
);

Assert.equal(counter, 4);
