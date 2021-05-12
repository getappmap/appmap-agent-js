import { strict as Assert } from 'assert';
import { assert } from '../../../../lib/server/assert.mjs';

Assert.throws(() => assert(false, '%j', { foo: 123 }), /^Error: {"foo":123}$/);

Assert.equal(assert(true, 'foo'), undefined);
