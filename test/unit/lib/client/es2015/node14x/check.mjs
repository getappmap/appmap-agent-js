import { strict as Assert } from 'assert';
import {
  assert,
  expect,
  setExitForTesting,
} from '../../../../../../lib/client/es2015/node14x/check.js';

setExitForTesting((code) => {
  throw new Error(String(code));
});

Assert.equal(assert(true, 'foo'), undefined);
Assert.throws(() => assert(false, 'foo %j', 456), /^Error: foo 456$/);
Assert.equal(expect(true, 'foo'), undefined);
Assert.throws(() => expect(false, 'foo %j', 456), /^Error: 123$/);
