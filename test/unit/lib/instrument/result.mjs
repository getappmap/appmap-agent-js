import { strict as Assert } from 'assert';
import {
  getEmptyResult,
  getResultEntities,
  getResultNode,
  combineResult,
  encapsulateResult,
} from '../../../../lib/instrument/result.mjs';

Assert.equal(getResultNode(getEmptyResult()), null);
Assert.deepEqual(getResultEntities(getEmptyResult()), []);

const result1 = combineResult(
  function callback(...args) {
    Assert.equal(new.target, undefined);
    Assert.equal(this, undefined);
    Assert.deepEqual(args, ['node', 'location', null, [null]]);
    return 'node1';
  },
  'node',
  'location',
  getEmptyResult(),
  [getEmptyResult()],
);
Assert.equal(getResultNode(result1), 'node1');
Assert.deepEqual(getResultEntities(result1), []);

const location1 = {
  makeEntity(...args) {
    Assert.equal(new.target, undefined);
    Assert.equal(this, location1);
    Assert.deepEqual(args, [[]]);
    return 'entity1';
  },
};

const result2 = encapsulateResult(result1, location1);
Assert.equal(getResultNode(result2), 'node1');
Assert.deepEqual(getResultEntities(result2), ['entity1']);
