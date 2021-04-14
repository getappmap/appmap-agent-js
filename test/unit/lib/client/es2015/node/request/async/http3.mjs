import { strict as Assert } from 'assert';
import makeRequestAsync from '../../../../../../../../lib/client/es2015/node/request/async/http3.js';

Assert.throws(() => makeRequestAsync());
