import { strict as Assert } from 'assert';
import makeRequestAsync from '../../../../../../../../lib/client/es2015/node14x/channel/request/http3.js';

Assert.throws(() => makeRequestAsync());
