import { strict as Assert } from 'assert';
import {
  validateRequest,
  validateConfigurationData,
  validateCLIOptions,
} from '../../../../lib/server/validate.mjs';

Assert.throws(
  () => validateRequest({ name: 'foo' }),
  /^Error: invalid request/,
);

Assert.equal(validateConfigurationData({ 'app-name': 'foo' }), undefined);

Assert.equal(validateCLIOptions({ port: 0 }), undefined);
