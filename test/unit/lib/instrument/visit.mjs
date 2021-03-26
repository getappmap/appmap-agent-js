import { strict as Assert } from 'assert';
import {
  visit,
  setVisitor,
  getEmptyArray,
  getEmptyResult,
} from '../../../../lib/instrument/visit.mjs';

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
  [true, 'entity0'],
  [false, null],
].forEach(([instrumentable, entity], index) => {
  const extended = {
    __proto__: null,
    shouldBeInstrumented(...args) {
      Assert.equal(this, extended);
      Assert.deepEqual(args, [file]);
      return instrumentable;
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
      Assert.equal(instrumentable, true);
      Assert.deepEqual(args, [input, { location: extended, namespace, file }]);
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
      Assert.equal(instrumentable, true);
      Assert.deepEqual(args, [
        input,
        { location: extended, namespace, file },
        'child1',
        ['child2'],
      ]);
      return output;
    },
  );

  Assert.deepEqual(
    visit(input, { location, namespace, file }),
    instrumentable
      ? {
          node: output,
          entities:
            entity === null ? ['entity1', 'entity2', 'entite3'] : [entity],
        }
      : {
          node: input,
          entities: [],
        },
  );
});

//
//
//
// ////////////////////////////////
// // shouldBeInstrumented: true //
// ////////////////////////////////
//
// {
//   input = {
//     type: 'Identifier',
//     name: "x"
//   };
//   const node2 = {
//     type: 'Identifier',
//     name: "y"
//   };
//   setVisitor("Program", (...args) => {
//     Assert.deeEqual(args, [node1, {location2, }]);
//     return [];
//   }, (...args) => {
//
//   });
//
//
//
//   assignVisitorObject('Program', {
//     Program: (...args) => {
//       Assert.deepEqual(args, [node1, location2]);
//       return combineResult((node, location) => node2, args[0], args[1]);
//     },
//   });
//   const result = visit('Program', node1, location1);
//   Assert.equal(getResultNode(result), node2);
//   Assert.deepEqual(getResultEntities(result), []);
// }
//
// /////////////////////////////////
// // shouldBeInstrumented: false //
// /////////////////////////////////
//
// {
//   const node1 = {
//     type: 'Program',
//     body: [],
//     sourceType: 'script',
//   };
//   const location2 = {
//     __proto__: null,
//     shouldBeInstrumented(...args) {
//       Assert.equal(this, location2);
//       Assert.deepEqual(args, []);
//       return false;
//     },
//   };
//   const location1 = {
//     __proto__: null,
//     extend(...args) {
//       Assert.equal(this, location1);
//       Assert.deepEqual(args, ['Program', node1]);
//       return location2;
//     },
//   };
//   assignVisitorObject('Program', {
//     Program: () => Assert.fail(),
//   });
//   const result = visit('Program', node1, location1);
//   Assert.equal(getResultNode(result), node1);
//   Assert.deepEqual(getResultEntities(result), []);
// }
