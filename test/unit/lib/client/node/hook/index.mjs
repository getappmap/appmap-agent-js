import { strict as Assert } from 'assert';
import { hook } from '../../../../../../lib/client/node/hook/index.js';

hook({
  esm: null,
  cjs: () => {
    Assert.fail();
  },
})();
