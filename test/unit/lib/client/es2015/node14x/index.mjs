import { strict as Assert } from 'assert';
import { makeAppmap } from '../../../../../../lib/client/es2015/node14x/index.js';

makeAppmap({
  protocol: {
    request: (json) => {
      Assert.equal(json.action, 'initialize');
      return { session: 'HIDDEN', hooking: { esm: false, cjs: false } };
    },
    requestAsync: () => {
      Assert.fail();
    },
  },
});
