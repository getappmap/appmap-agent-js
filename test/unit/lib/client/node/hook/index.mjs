import { strict as Assert } from 'assert';
import { hook } from '../../../../../../lib/client/node/hook/index.js';

hook(
  {
    esm: null,
    cjs: {},
    http: null,
    mysql: null,
    pg: null,
    sqlite3: null,
  },
  {
    instrumentScript: () => {
      Assert.fail();
    },
    instrumentModuleAsync: () => {
      Assert.fail();
    },
    makeCouple: () => {
      Assert.fail();
    },
  },
)();
