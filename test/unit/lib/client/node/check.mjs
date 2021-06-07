import { strict as Assert } from 'assert';
import * as Module from 'module';

process.exit = (...args) => {
  Assert.deepEqual(args, [123]);
  throw new Error('exit');
};

const require = Module.createRequire(import.meta.url);

const {
  assert,
  expect,
  expectSuccess,
  check,
  checkError,
} = require('../../../../../lib/client/node/check.js');

Assert.equal(assert(true, 'foo'), undefined);
Assert.throws(() => assert(false, 'foo %j', 456), /^Error: foo 456$/);
Assert.equal(expect(true, 'foo'), undefined);
Assert.throws(() => expect(false, 'foo %j', 456), /^Error: exit$/);
Assert.equal(
  expectSuccess(() => {}, 'foo'),
  undefined,
);
Assert.throws(
  () =>
    expectSuccess(() => {
      throw new Error('boum');
    }, 'foo %j'),
  /^Error: exit$/u,
);
Assert.throws(() => check(false, Error, 'foo'), /^Error: foo/u);

Assert.throws(() => checkError(false, new Error('foo')), /^Error: foo/u);

//
// Assert.throws(
//   () =>
//     expectSuccess(
//       () => {
//         throw new Error('BOUM');
//       },
//       'foo %j %s',
//       456,
//     ),
//   /^Error: foo 456 BOUM$/,
// );
