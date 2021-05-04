import { strict as Assert } from 'assert';
import {makeChannel} from '../../../../../../../lib/client/es2015/node14x/channel/index.js';

Assert.equal(typeof makeChannel('inline', 'localhost', 0), 'object');

Assert.equal(
  typeof makeChannel('http1', 'localhost', 0),
  'object',
);

Assert.deepEqual(
  makeChannel({
      requestSync: 123,
      request: 456,
    },
    'localhost',
    0
  ),
  {
    requestSync: 123,
    request: 456,
  },
);

Assert.throws(() => {
  makeChannel('foobar', 'localhost', 0);
}, /^Error: invalid protocol/u);
