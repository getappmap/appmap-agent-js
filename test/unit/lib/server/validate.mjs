import { strict as Assert } from 'assert';
import {
  validateRequest,
  validateConfigurationData,
  validateCLIOptions,
} from '../../../../lib/server/validate.mjs';

Assert.ok(
  validateRequest({ name: 'foo' }).fromLeft().startsWith("invalid request"),
);

Assert.deepEqual(validateConfigurationData({ 'app-name': 'foo' }).fromRight(), {'app-name':'foo'});

Assert.deepEqual(validateCLIOptions({ port: 0 }).fromRight(), {port:0});
