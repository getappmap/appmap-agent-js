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

Assert.equal(
  makeChannel({
    APPMAP_PROTOCOL: 123,
  }),
  123,
);

Assert.throws(() => {
  makeChannel({
    APPMAP_PROTOCOL: 'foobar',
  });
}, /^Error: Invalid APPMAP_PROTOCOL/);
