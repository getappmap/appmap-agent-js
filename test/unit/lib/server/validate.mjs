import { strict as Assert } from 'assert';
import {
  validateRequest,
  validateConfiguration,
  validateOptions,
} from '../../../../lib/server/validate.mjs';

Assert.throws(
  () => validateRequest({ name: 'foo' }),
  /^Error: invalid request/,
);

Assert.equal(validateConfiguration({ 'app-name': 'foo' }), undefined);

Assert.equal(validateOptions({ port: 0 }), undefined);
