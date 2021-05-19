import { strict as Assert } from 'assert';
import * as Util from 'util';
import {
  assert,
  expect,
  expectSuccess,
  setExitForTesting,
} from '../../../../../../lib/client/es2015/node14x/check.js';

setExitForTesting((template, values) => {
  throw new Error(Util.format(template, ...values));
});

Assert.equal(assert(true, 'foo'), undefined);
Assert.throws(() => assert(false, 'foo %j', 456), /^Error: foo 456$/);
Assert.equal(expect(true, 'foo'), undefined);
Assert.throws(() => expect(false, 'foo %j', 456), /^Error: foo 456$/);
Assert.equal(
  expectSuccess(() => {}, 'foo'),
  undefined,
);
Assert.throws(
  () =>
    expectSuccess(
      () => {
        throw new Error('BOUM');
      },
      'foo %j %s',
      456,
    ),
  /^Error: foo 456 BOUM$/,
);
