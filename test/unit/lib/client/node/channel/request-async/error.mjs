import { strict as Assert } from 'assert';
import { switchExpectToTestingMode } from '../../../../../../../lib/client/node/check.js';
import { makeErrorHandler } from '../../../../../../../lib/client/node/channel/request-async/error.js';

switchExpectToTestingMode();

Assert.throws(
  () => makeErrorHandler('foo')(new Error('bar')),
  /^Error: foo error >> bar$/,
);
