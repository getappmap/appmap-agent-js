import { strict as Assert } from 'assert';
import { switchExpectToTestingMode } from '../../../../../../../../lib/client/es2015/node14x/check.js';
import { makeErrorHandler } from '../../../../../../../../lib/client/es2015/node14x/channel/request-async/error.js';

switchExpectToTestingMode();

Assert.throws(
  () => makeErrorHandler('foo')(new Error('bar')),
  /^Error: foo error >> bar$/,
);
