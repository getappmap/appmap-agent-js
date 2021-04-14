
import { strict as Assert } from "assert";
import makeChannel from '../../../../../../lib/client/es2015/node/channel.js';

makeChannel({
  APPMAP_PROTOCOL: "inline"
});

makeChannel({
  APPMAP_PROTOCOL: "http1",
  APPMAP_HOST: "localhost",
  APPMAP_PORT: 0
});

Assert.throws(() => {
  makeChannel({
    APPMAP_PROTOCOL: "foobar"
  });
}, /^Error: Invalid APPMAP_PROTOCOL/)
