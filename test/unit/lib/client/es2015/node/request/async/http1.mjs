import makeRequestAsync from '../../../../../../../../lib/client/es2015/node/request/async/http1.js';
import fixture from './__fixture__.mjs';

makeRequestAsync('localhost', 'tmp/ipc.sock');

fixture('http1', makeRequestAsync);
