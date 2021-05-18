import { strict as Assert } from 'assert';
import { setExitForTesting } from '../../../../../../../../lib/client/es2015/node14x/check.js';
import { makeErrorHandler } from '../../../../../../../../lib/client/es2015/node14x/channel/request-async/error.js';

setExitForTesting((code) => {
  throw new Error(code);
});

Assert.throws(() => makeErrorHandler('foo')(new Error('bar')), /^Error: 123$/);
