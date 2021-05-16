import { strict as Assert } from 'assert';
import * as Module from 'module';

let counter = 0;

process.env = {
  ...process.env,
  APPMAP_PROTOCOL: {
    request: (json) => {
      Assert.equal(json.action, 'initialize');
      counter += 1;
      return null;
    },
    requestAsync: () => {
      Assert.fail();
    },
  },
};

const require = Module.createRequire(import.meta.url);

require('../../../../../../../lib/client/es2015/node14x/recorder/normal-bin.js');

Assert.equal(counter, 1);
