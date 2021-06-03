import { strict as Assert } from 'assert';
import { hook } from '../../../../../../lib/client/node/hook/index.js';

hook(
  {
    esm: false,
    cjs: true,
    http: false,
    mysql: false,
  },
  {
    instrumentScript: () => {
      Assert.fail();
    },
    instrumentModuleAsync: () => {
      Assert.fail();
    },
    recordCall: () => {
      Assert.fail();
    },
  },
)();
