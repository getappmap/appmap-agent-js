import { strict as Assert } from 'assert';
import {
  visit,
  setVisitor,
  getEmptyArray,
  getEmptyResult,
} from '../../../../../lib/server/instrument/visit.mjs';

Assert.deepEqual(getEmptyArray(), []);

Assert.deepEqual(getEmptyResult(), {
  node: null,
  entities: [],
});

const namespace = 'namespace';

const file = 'file';

const input = {
  type: 'Identifier',
  name: 'x',
};

const output = {
  type: 'Identifier',
  name: 'y',
};

[
  [false, 'entity0'],
  [true, null],
].forEach(([excluded, entity], index) => {
  const isNameExcluded = (...args) => {
    Assert.deepEqual(args, ['???']);
    return excluded;
  };
  const extended = {
    __proto__: null,
    getName(...args) {
      Assert.equal(this, extended);
      Assert.deepEqual(args, [file]);
      return '???';
    },
    makeEntity(...args) {
      Assert.equal(this, extended);
      Assert.deepEqual(args, [['entity1', 'entity2', 'entite3'], file]);
      return entity;
    },
  };
  const location = {
    __proto__: null,
    extend(...args) {
      Assert.equal(this, location);
      Assert.deepEqual(args, [input]);
      return extended;
    },
  };
  setVisitor(
    'Identifier',
    (...args) => {
      Assert.equal(excluded, false);
      Assert.deepEqual(args, [
        input,
        { location: extended, namespace, file, isNameExcluded },
      ]);
      return [
        {
          node: 'child1',
          entities: ['entity1', 'entity2'],
        },
        [
          {
            node: 'child2',
            entities: ['entite3'],
          },
        ],
      ];
    },
    (...args) => {
      Assert.equal(excluded, false);
      Assert.deepEqual(args, [
        input,
        { location: extended, namespace, file, isNameExcluded },
        'child1',
        ['child2'],
      ]);
      return output;
    },
  );

  Assert.deepEqual(
    visit(input, { location, namespace, file, isNameExcluded }),
    excluded
      ? {
          node: input,
          entities: [],
        }
      : {
          node: output,
          entities:
            entity === null ? ['entity1', 'entity2', 'entite3'] : [entity],
        },
  );
});

{
  const isNameExcluded = () => false;
  const location = {
    __proto__: null,
    extend: () => location,
    getName: () => '???',
    makeEntity: () => null,
  };
  Assert.deepEqual(
    visit({ type: 'Foo' }, { location, namespace, file, isNameExcluded }),
    {
      node: {
        type: 'Foo',
      },
      entities: [],
    },
  );
}
