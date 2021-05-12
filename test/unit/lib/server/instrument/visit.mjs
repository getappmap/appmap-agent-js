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
  const options = {
    exclude: new Set(excluded ? ['???'] : []),
  };
  const extended = {
    __proto__: null,
    getName(...args) {
      Assert.equal(this, extended);
      Assert.deepEqual(args, []);
      return '???';
    },
    makeEntity(...args) {
      Assert.equal(this, extended);
      Assert.deepEqual(args, [['entity1', 'entity2', 'entite3']]);
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
      Assert.ok(!excluded);
      Assert.deepEqual(args, [input, { location: extended, options }]);
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
      Assert.ok(!excluded);
      Assert.deepEqual(args, [
        input,
        { location: extended, options },
        'child1',
        ['child2'],
      ]);
      return output;
    },
  );

  Assert.deepEqual(
    visit(input, { location, options }),
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
