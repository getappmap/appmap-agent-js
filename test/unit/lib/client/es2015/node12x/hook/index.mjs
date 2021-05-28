import { strict as Assert } from 'assert';
import { hook } from '../../../../../../../lib/client/es2015/node12x/hook/index.js';

hook({
  esm: null,
  cjs: () => {
    Assert.fail();
  },
})();
