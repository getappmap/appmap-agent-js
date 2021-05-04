
import {strict as Assert} from 'assert';
import * as Module from "module";

let counter = 0;

process.env = {
  ...process.env,
  APPMAP_PROTOCOL: {
    requestSync: (json) => {
      Assert.equal(json.action, "initialize");
      counter += 1;
      return {enabled:false, session:null, namespace:null};
    },
    request: () => {
      Assert.fail();
    }
  }
};

const require = Module.createRequire(import.meta.url);

require('../../../../../../../lib/client/es2015/node14x/plugin/mono-bin.js');

Assert.equal(counter, 1);
