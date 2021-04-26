import { strict as Assert } from 'assert';
import {
  validateRequest,
  validateConfiguration,
} from '../../../../lib/server/validate.mjs';

Assert.throws(
  () => validateRequest({ name: 'foo' }),
  /^Error: invalid request/,
);

Assert.equal(validateConfiguration({ 'app-name': 'foo' }), undefined);
