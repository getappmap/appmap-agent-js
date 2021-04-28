import { strict as Assert } from 'assert';
import makeChannel from '../../../../../../lib/client/es2015/node14x/channel.js';

Assert.equal(typeof makeChannel({ protocol: 'inline' }), 'object');

Assert.equal(
  typeof makeChannel({
    protocol: 'http1',
    host: 'localhost',
    port: '0',
  }),
  'object',
);

Assert.deepEqual(
  makeChannel({
    protocol: {
      requestSync: 123,
      requestAsync: 456,
    },
  }),
  {
    inline: false,
    requestSync: 123,
    requestAsync: 456,
  },
);

Assert.throws(() => {
  makeChannel({
    protocol: 'foobar',
  });
}, /^Error: Invalid APPMAP_PROTOCOL/);
