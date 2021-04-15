import { strict as Assert } from 'assert';
import makeChannel from '../../../../../../lib/client/es2015/node/channel.js';

Assert.equal(
  typeof makeChannel({
    APPMAP_PROTOCOL: 'inline',
  }),
  'object',
);

Assert.equal(
  typeof makeChannel({
    APPMAP_PROTOCOL: 'http1',
    APPMAP_HOST: 'localhost',
    APPMAP_PORT: 0,
  }),
  'object',
);

Assert.deepEqual(
  makeChannel({
    APPMAP_PROTOCOL: {
      requestSync: 123,
      requestAsync: 456,
    },
  }),
  {
    inline: false,
    env: {},
    requestSync: 123,
    requestAsync: 456,
  },
);

Assert.throws(() => {
  makeChannel({
    APPMAP_PROTOCOL: 'foobar',
  });
}, /^Error: Invalid APPMAP_PROTOCOL/);
